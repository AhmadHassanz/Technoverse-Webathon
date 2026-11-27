-- ============================================================
-- Secure Examination Management System — database schema
-- Run ONCE in Supabase: Dashboard → SQL Editor → paste → Run.
-- Owner: backend. Keep this file in git as the source of truth.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- profiles (1 row per auth user) ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text not null check (char_length(full_name) between 1 and 100),
  role         text not null default 'candidate' check (role in ('admin','examiner','candidate')),
  is_active    boolean not null default true,
  preferences  jsonb not null default '{"theme":"light","fontScale":"md","navigatorSide":"left","layout":"single"}'::jsonb,
  created_at   timestamptz not null default now()
);

-- Every new auth user gets a profile. Role is ALWAYS candidate here;
-- admins change roles through the API (service role).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)));
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- question bank ----------
create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 60),
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (created_by, name)
);

create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  topic_id        uuid not null references public.topics(id) on delete restrict,
  type            text not null check (type in ('mcq_single','mcq_multi','written')),
  stem            text not null check (char_length(stem) between 5 and 2000),
  difficulty      text not null check (difficulty in ('easy','medium','hard')),
  marks           numeric(6,2) not null check (marks > 0 and marks <= 100),
  multi_scheme    text not null default 'all_or_nothing' check (multi_scheme in ('all_or_nothing','partial')),
  negative_marks  numeric(6,2) not null default 0 check (negative_marks >= 0),
  created_by      uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  check (negative_marks <= marks)
);

create table public.question_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.questions(id) on delete cascade,
  label        text not null check (char_length(label) between 1 and 500),
  is_correct   boolean not null default false,
  position     int not null
);
create index on public.question_options (question_id);

-- ---------- exams ----------
create table public.exams (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null check (char_length(title) between 3 and 120),
  instructions          text not null default '' check (char_length(instructions) <= 5000),
  start_at              timestamptz not null,
  end_at                timestamptz not null,
  duration_min          int not null check (duration_min between 1 and 600),
  total_marks           numeric(7,2) not null check (total_marks > 0),
  pass_marks            numeric(7,2) not null default 0 check (pass_marks >= 0),
  status                text not null default 'draft' check (status in ('draft','published')),
  shuffle_questions     boolean not null default true,
  shuffle_options       boolean not null default true,
  blueprint             jsonb,  -- {"easy":4,"medium":4,"hard":2} or null
  results_published_at  timestamptz,
  created_by            uuid not null references public.profiles(id),
  created_at            timestamptz not null default now(),
  check (end_at > start_at),
  check (pass_marks <= total_marks)
);
-- The examiner overview lists one owner's exams, newest first.
create index if not exists exams_owner_idx on public.exams (created_by, created_at desc);

-- State is DERIVED so it can never be wrong.
create or replace view public.exam_state as
select e.id,
       case
         when e.status = 'draft' then 'draft'
         when now() < e.start_at then 'published'
         when now() < e.end_at then 'ongoing'
         else 'completed'
       end as state
from public.exams e;

create table public.exam_questions (
  exam_id      uuid not null references public.exams(id) on delete cascade,
  question_id  uuid not null references public.questions(id) on delete restrict,
  position     int not null,
  primary key (exam_id, question_id)
);

create table public.enrollments (
  exam_id       uuid not null references public.exams(id) on delete cascade,
  candidate_id  uuid not null references public.profiles(id) on delete cascade,
  enrolled_at   timestamptz not null default now(),
  primary key (exam_id, candidate_id)
);
-- The candidate dashboard looks up "my enrollments" by candidate (the primary key starts with exam_id).
create index if not exists enrollments_candidate_idx on public.enrollments (candidate_id);

-- ---------- attempts ----------
create table public.attempts (
  id                 uuid primary key default gen_random_uuid(),
  exam_id            uuid not null references public.exams(id) on delete cascade,
  candidate_id       uuid not null references public.profiles(id) on delete cascade,
  is_sandbox         boolean not null default false,
  status             text not null default 'in_progress'
                     check (status in ('in_progress','submitted','auto_submitted','graded')),
  started_at         timestamptz not null default now(),
  ends_at            timestamptz not null,           -- base deadline, NOT including compensation
  compensation_sec   int not null default 0 check (compensation_sec between 0 and 600),
  submitted_at       timestamptz,
  last_heartbeat_at  timestamptz,
  score              numeric(7,2),
  paper_difficulty   numeric(5,2)
);
-- One REAL attempt per candidate per exam. Sandbox attempts don't count.
create unique index attempts_one_real_per_candidate
  on public.attempts (exam_id, candidate_id) where is_sandbox = false;
create index on public.attempts (exam_id);
-- The candidate dashboard reads all of one candidate's attempts.
create index if not exists attempts_candidate_idx on public.attempts (candidate_id);

-- Frozen paper: what this candidate got, with the marking scheme at that moment.
-- snapshot = {"type","stem","marks","difficulty","multiScheme","negativeMarks",
--             "options":[{"id","label","isCorrect"}]}   (options already in shuffled order)
create table public.attempt_questions (
  id             uuid primary key default gen_random_uuid(),
  attempt_id     uuid not null references public.attempts(id) on delete cascade,
  question_id    uuid not null references public.questions(id) on delete restrict,
  position       int not null,
  snapshot       jsonb not null,
  marks_awarded  numeric(6,2),
  feedback       text,
  graded_by      uuid references public.profiles(id),
  unique (attempt_id, position)
);
create index on public.attempt_questions (attempt_id);
create index on public.attempt_questions (question_id);

create table public.answers (
  attempt_id           uuid not null references public.attempts(id) on delete cascade,
  attempt_question_id  uuid not null references public.attempt_questions(id) on delete cascade,
  selected_option_ids  uuid[] not null default '{}',
  text_answer          text not null default '' check (char_length(text_answer) <= 10000),
  flagged              boolean not null default false,
  client_seq           int not null default 0,
  saved_at             timestamptz not null default now(),
  primary key (attempt_id, attempt_question_id)
);

-- ---------- monitoring ----------
create table public.incidents (
  id             uuid primary key default gen_random_uuid(),
  attempt_id     uuid not null references public.attempts(id) on delete cascade,
  type           text not null check (type in ('tab_hidden','window_blur','fullscreen_exit','copy_paste','offline','resumed','late_sync')),
  detail         text,
  created_at     timestamptz not null default now(),
  reviewed       boolean not null default false,
  reviewer_note  text
);
create index on public.incidents (attempt_id);

create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  exam_id     uuid not null references public.exams(id) on delete cascade,
  message     text not null check (char_length(message) between 1 and 500),
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index on public.announcements (exam_id);

create table public.compensation_requests (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references public.attempts(id) on delete cascade,
  gap_sec     int not null check (gap_sec > 0),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  decided_at  timestamptz
);
create index on public.compensation_requests (attempt_id);

-- ---------- workspace extras & reports ----------
create table public.scratchpads (
  attempt_id  uuid primary key references public.attempts(id) on delete cascade,
  text        text not null default '' check (char_length(text) <= 20000),
  drawing     text,  -- PNG data URL
  updated_at  timestamptz not null default now()
);

create table public.report_verifications (
  code        text primary key,  -- 10 random chars, shown + in QR
  attempt_id  uuid not null unique references public.attempts(id) on delete cascade,
  issued_at   timestamptz not null default now()
);

-- ============================================================
-- Atomic answer save: keeps only the NEWEST client_seq.
-- Returns true if stored, false if the server already had a newer one.
-- Time/permission checks happen in the backend service BEFORE calling this.
-- ============================================================
create or replace function public.save_answer(
  p_attempt uuid, p_aq uuid, p_selected uuid[], p_text text, p_flagged boolean, p_seq int
) returns boolean language plpgsql as $$
declare v_rows int;
begin
  insert into public.answers (attempt_id, attempt_question_id, selected_option_ids, text_answer, flagged, client_seq, saved_at)
  values (p_attempt, p_aq, coalesce(p_selected, '{}'), coalesce(p_text, ''), coalesce(p_flagged, false), p_seq, now())
  on conflict (attempt_id, attempt_question_id) do update
    set selected_option_ids = excluded.selected_option_ids,
        text_answer         = excluded.text_answer,
        flagged             = excluded.flagged,
        client_seq          = excluded.client_seq,
        saved_at            = now()
    where public.answers.client_seq < excluded.client_seq;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end $$;

-- ============================================================
-- Security: RLS ON for every table with NO policies = deny all
-- for the public anon/publishable key. Only the backend (service
-- role / secret key, server-only) can read or write. Authorization
-- is enforced in backend/services before every query.
-- ============================================================
alter table public.profiles              enable row level security;
alter table public.topics                enable row level security;
alter table public.questions             enable row level security;
alter table public.question_options      enable row level security;
alter table public.exams                 enable row level security;
alter table public.exam_questions        enable row level security;
alter table public.enrollments           enable row level security;
alter table public.attempts              enable row level security;
alter table public.attempt_questions     enable row level security;
alter table public.answers               enable row level security;
alter table public.incidents             enable row level security;
alter table public.announcements         enable row level security;
alter table public.compensation_requests enable row level security;
alter table public.scratchpads           enable row level security;
alter table public.report_verifications  enable row level security;

revoke execute on function public.save_answer(uuid, uuid, uuid[], text, boolean, int) from public, anon, authenticated;
revoke all on public.exam_state from anon, authenticated;
-- The backend's service role (secret key) keeps access.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.save_answer(uuid, uuid, uuid[], text, boolean, int) to service_role;
    grant select on public.exam_state to service_role;
  end if;
end $$;
