// Demo data (seed v2). Run:  npm run seed
// Safe to run many times and it NEVER deletes anything:
//   - accounts are re-used (password + role reset),
//   - topics / questions / exams that already exist are skipped,
//   - the "live" exams (running + upcoming) only get fresh dates, so they stay open for the demo.
// Self-contained on purpose (only @supabase/supabase-js) so Node can run it directly.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Run with: npm run seed");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false } });

const PASSWORD = "Demo@1234";
const HOUR = 3600_000;
const DAY = 24 * HOUR;
const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();

// ---------- tiny seeded random generator, so the demo data looks the same on every run ----------
let state = 20261127;
function rnd(): number {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(items: T[]): T => items[Math.floor(rnd() * items.length)];
function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// ---------- accounts ----------
const accounts = [
  { email: "admin@demo.com", fullName: "Hassan Admin", role: "admin" },
  { email: "examiner@demo.com", fullName: "Dr. Ayesha Khan", role: "examiner" },
  { email: "ali@demo.com", fullName: "Ali Raza", role: "candidate" },
  { email: "sara@demo.com", fullName: "Sara Ahmed", role: "candidate" },
  { email: "hamza@demo.com", fullName: "Hamza Malik", role: "candidate" },
  { email: "zainab@demo.com", fullName: "Zainab Tariq", role: "candidate" },
  { email: "bilal@demo.com", fullName: "Bilal Hussain", role: "candidate" },
  { email: "fatima@demo.com", fullName: "Fatima Noor", role: "candidate" },
  { email: "usman@demo.com", fullName: "Usman Sheikh", role: "candidate" },
  { email: "hira@demo.com", fullName: "Hira Aslam", role: "candidate" },
  { email: "omar@demo.com", fullName: "Omar Farooq", role: "candidate" },
  { email: "maryam@demo.com", fullName: "Maryam Iqbal", role: "candidate" },
];

async function findUserId(email: string): Promise<string | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
  }
  return null;
}

const ids = new Map<string, string>(); // email -> profile id
for (const a of accounts) {
  let id: string | null;
  const created = await db.auth.admin.createUser({
    email: a.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: a.fullName },
  });
  if (created.error) {
    id = await findUserId(a.email);
    if (!id) throw created.error;
    await db.auth.admin.updateUserById(id, { password: PASSWORD, email_confirm: true });
  } else {
    id = created.data.user.id;
  }
  const { error } = await db.from("profiles").update({ role: a.role, full_name: a.fullName, is_active: true }).eq("id", id);
  if (error) throw error;
  ids.set(a.email, id);
}
console.log(`ok  ${accounts.length} accounts (password for all: ${PASSWORD})`);

const examinerId = ids.get("examiner@demo.com")!;
const candidates = accounts.filter((a) => a.role === "candidate").map((a) => ({ id: ids.get(a.email)!, name: a.fullName, email: a.email }));

// ---------- question bank ----------
type Diff = "easy" | "medium" | "hard";
type Q = { stem: string; options: string[]; correct: number[]; difficulty: Diff; marks: number; type?: "mcq_single" | "mcq_multi" | "written"; scheme?: "all_or_nothing" | "partial"; negative?: number };
const single = (difficulty: Diff, marks: number, stem: string, options: string[]): Q => ({ stem, options, correct: [0], difficulty, marks, type: "mcq_single", negative: 0.5 }); // first option is always the right one; options are shuffled per paper
const multi = (difficulty: Diff, marks: number, stem: string, options: string[], correct: number[], scheme: "all_or_nothing" | "partial" = "all_or_nothing", negative = 0): Q => ({ stem, options, correct, difficulty, marks, type: "mcq_multi", scheme, negative });
const written = (difficulty: Diff, marks: number, stem: string): Q => ({ stem, options: [], correct: [], difficulty, marks, type: "written", negative: 0 });

const DB_POOL: Q[] = [
  single("easy", 2, "Which SQL statement is used to read rows from a table?", ["SELECT", "INSERT", "UPDATE", "DELETE"]),
  single("easy", 2, "What does a PRIMARY KEY guarantee?", ["Each row is uniquely identified and never NULL", "Faster INSERT statements", "Encrypted column values", "Automatic daily backups"]),
  single("easy", 2, "Which command removes a table together with all of its data?", ["DROP TABLE", "TRUNCATE ROWS", "DELETE TABLE", "CLEAR TABLE"]),
  single("easy", 2, "Which clause filters individual rows BEFORE they are grouped?", ["WHERE", "HAVING", "ORDER BY", "LIMIT"]),
  single("easy", 2, "Which aggregate function counts rows?", ["COUNT", "SUM", "AVG", "MAX"]),
  single("easy", 2, "In ACID, what does the letter A stand for?", ["Atomicity", "Availability", "Authorization", "Aggregation"]),
  single("easy", 2, "Which keyword sorts the result of a query?", ["ORDER BY", "GROUP BY", "SORT", "ARRANGE"]),
  single("easy", 2, "A foreign key is used to...", ["Link a row to a row in another table", "Sort a table faster", "Store passwords safely", "Compress table data"]),
  single("medium", 3, "Which join returns ALL rows of the left table, even when there is no match on the right?", ["LEFT JOIN", "INNER JOIN", "CROSS JOIN", "SELF JOIN"]),
  single("medium", 3, "Which normal form removes partial dependencies on a composite key?", ["Second normal form (2NF)", "First normal form (1NF)", "Third normal form (3NF)", "Fourth normal form (4NF)"]),
  single("medium", 3, "What is the main purpose of an index?", ["Speed up searches on a column", "Enforce foreign keys", "Back up the table", "Encrypt the column"]),
  single("medium", 3, "Reading data that another transaction has not committed yet is called a...", ["Dirty read", "Lost update", "Phantom row", "Deadlock"]),
  multi("medium", 3, "Which of these are aggregate functions? (select all that apply)", ["COUNT", "SUM", "UPPER", "AVG"], [0, 1, 3]),
  single("medium", 3, "How does HAVING differ from WHERE?", ["HAVING filters groups after aggregation", "HAVING filters rows before grouping", "HAVING sorts the result", "HAVING joins two tables"]),
  single("medium", 3, "Which statement about NULL is true?", ["NULL = NULL is not TRUE (the result is unknown)", "NULL equals 0", "NULL equals an empty string", "NULL is the same as FALSE"]),
  single("medium", 3, "What does COMMIT do?", ["Makes the changes of the transaction permanent", "Undoes the transaction", "Locks the whole table", "Creates an index"]),
  multi("hard", 5, "Which properties are guaranteed by ACID transactions? (select all that apply)", ["Atomicity", "Isolation", "Durability", "Scalability"], [0, 1, 2]),
  single("hard", 5, "A relation is in BCNF when...", ["Every determinant is a candidate key", "It has no NULL values", "It has no foreign keys", "It has exactly one index"]),
  single("hard", 5, "Which technique lets readers avoid blocking writers in PostgreSQL?", ["MVCC (multi-version concurrency control)", "Table-level locks", "Two-phase commit", "Sharding"]),
  single("hard", 5, "What is a deadlock?", ["Two transactions each wait for a lock the other holds", "A query that runs slowly", "A lost network connection", "A full disk"]),
];

const NET_QUIZ: Q[] = [
  single("easy", 2, "Which layer of the OSI model is responsible for routing packets between networks?", ["Network layer", "Transport layer", "Data link layer", "Session layer"]),
  single("easy", 2, "Which protocol provides reliable, ordered delivery of data?", ["TCP", "UDP", "ICMP", "ARP"]),
  single("easy", 2, "What is the default port of HTTPS?", ["443", "80", "22", "25"]),
  single("easy", 2, "What does DNS do?", ["Translates domain names into IP addresses", "Assigns IP addresses to hosts", "Encrypts web traffic", "Blocks unwanted traffic"]),
  single("medium", 2, "Which device forwards packets between different networks?", ["Router", "Hub", "Repeater", "Cable"]),
  single("medium", 2, "Which address is burned into a network card by its manufacturer?", ["MAC address", "IPv4 address", "Port number", "Subnet mask"]),
  multi("medium", 4, "Select ALL private IPv4 ranges.", ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "8.8.8.0/24"], [0, 1, 2], "partial"),
  written("hard", 4, "Explain in 2-3 sentences why TCP uses a three-way handshake before sending data."),
];

const OS_FINAL: Q[] = [
  single("easy", 2, "Which scheduling algorithm gives each process a fixed time slice in turn?", ["Round robin", "First come first served", "Shortest job first", "Priority scheduling"]),
  single("easy", 2, "What is virtual memory?", ["Disk space used to extend RAM", "A second CPU", "A kind of cache inside the CPU", "A network drive"]),
  single("easy", 2, "Which of these is NOT a process state?", ["Compiling", "Ready", "Running", "Waiting"]),
  single("medium", 2, "Which Unix system call creates a new process?", ["fork", "exec", "wait", "exit"]),
  single("medium", 2, "Which page replacement policy evicts the least recently used page?", ["LRU", "FIFO", "Optimal", "Random"]),
  single("medium", 2, "A semaphore is mainly used for...", ["Synchronisation between processes", "Formatting disks", "Compiling programs", "Printing documents"]),
  multi("hard", 4, "Which are necessary conditions for a deadlock? (select all that apply)", ["Mutual exclusion", "Hold and wait", "No preemption", "Round-robin scheduling"], [0, 1, 2], "all_or_nothing", 1),
  written("hard", 4, "Differentiate between a process and a thread."),
  written("hard", 4, "Explain what a race condition is and give one way to prevent it."),
];

const SE_PRACTICE: Q[] = [
  single("easy", 2, "In Scrum, who is responsible for prioritising the product backlog?", ["Product Owner", "Scrum Master", "Developers", "Stakeholders"]),
  single("easy", 2, "Which UML diagram shows how users interact with a system?", ["Use case diagram", "Class diagram", "Sequence diagram", "State diagram"]),
  single("easy", 2, "What does the S in SOLID stand for?", ["Single responsibility", "Simple design", "Secure coding", "Structured logic"]),
  single("easy", 2, "Which kind of testing checks one small function in isolation?", ["Unit testing", "System testing", "Load testing", "Acceptance testing"]),
  single("medium", 2, "Which Git command records staged changes in the history?", ["git commit", "git add", "git fetch", "git stash"]),
  single("medium", 2, "What is technical debt?", ["The future cost of choosing a quick solution now", "Money owed to developers", "A bug in the database", "A late software licence"]),
  single("medium", 2, "Which of these is a NON-functional requirement?", ["Pages must load in under 2 seconds", "Users can reset their password", "Admins can export a report", "Candidates can submit an exam"]),
  single("medium", 2, "Which model completes each phase fully before the next one starts?", ["Waterfall", "Scrum", "Kanban", "Spiral"]),
];

const topicIds = new Map<string, string>();
async function ensureTopic(name: string): Promise<string> {
  const found = await db.from("topics").select("id").eq("created_by", examinerId).eq("name", name).maybeSingle();
  if (found.error) throw found.error;
  if (found.data) return found.data.id;
  const made = await db.from("topics").insert({ name, created_by: examinerId }).select("id").single();
  if (made.error) throw made.error;
  return made.data.id;
}

type SavedQuestion = Q & { id: string; optionIds: string[] };
/** Returns the questions of a topic; inserts them only when the topic has none yet. */
async function ensureQuestions(topicName: string, list: Q[]): Promise<SavedQuestion[]> {
  const topicId = await ensureTopic(topicName);
  topicIds.set(topicName, topicId);
  const existing = await db.from("questions").select("id, stem").eq("topic_id", topicId);
  if (existing.error) throw existing.error;
  if ((existing.data ?? []).length === 0) {
    for (const q of list) {
      const made = await db
        .from("questions")
        .insert({ topic_id: topicId, type: q.type ?? "mcq_single", stem: q.stem, difficulty: q.difficulty, marks: q.marks, multi_scheme: q.scheme ?? "all_or_nothing", negative_marks: q.negative ?? 0, created_by: examinerId })
        .select("id")
        .single();
      if (made.error) throw made.error;
      if (q.options.length) {
        const { error } = await db.from("question_options").insert(q.options.map((label, i) => ({ question_id: made.data.id, label, is_correct: q.correct.includes(i), position: i + 1 })));
        if (error) throw error;
      }
    }
  }
  // read back (ids + options in position order), matched to the list by stem
  const rows = await db.from("questions").select("id, stem, question_options(id, position)").eq("topic_id", topicId);
  if (rows.error) throw rows.error;
  const byStem = new Map(rows.data.map((r) => [r.stem as string, r]));
  return list.map((q) => {
    const row = byStem.get(q.stem);
    if (!row) throw new Error(`Question missing after insert: ${q.stem}`);
    const opts = [...(row.question_options as { id: string; position: number }[])].sort((a, b) => a.position - b.position);
    return { ...q, id: row.id as string, optionIds: opts.map((o) => o.id) };
  });
}

// ---------- exams ----------
async function findExam(title: string) {
  const r = await db.from("exams").select("id, results_published_at").eq("created_by", examinerId).eq("title", title).maybeSingle();
  if (r.error) throw r.error;
  return r.data as { id: string; results_published_at: string | null } | null;
}

type ExamDef = {
  title: string;
  instructions: string;
  startAt: number;
  endAt: number;
  durationMin: number;
  totalMarks: number;
  passMarks: number;
  status: "draft" | "published";
  blueprint?: { easy: number; medium: number; hard: number };
  shuffleQuestions?: boolean;
  questions: SavedQuestion[];
  enrol: boolean;
};
type Exam = { id: string; created: boolean };

async function ensureExam(d: ExamDef, refreshDates: boolean): Promise<Exam> {
  const existing = await findExam(d.title);
  let id: string;
  let created = false;
  if (existing) {
    id = existing.id;
    if (refreshDates) {
      const { error } = await db.from("exams").update({ start_at: iso(d.startAt), end_at: iso(d.endAt) }).eq("id", id);
      if (error) throw error;
    }
  } else {
    const made = await db
      .from("exams")
      .insert({
        title: d.title,
        instructions: d.instructions,
        start_at: iso(d.startAt),
        end_at: iso(d.endAt),
        duration_min: d.durationMin,
        total_marks: d.totalMarks,
        pass_marks: d.passMarks,
        status: d.status,
        shuffle_questions: d.shuffleQuestions ?? true,
        shuffle_options: true,
        blueprint: d.blueprint ?? null,
        created_by: examinerId,
      })
      .select("id")
      .single();
    if (made.error) throw made.error;
    id = made.data.id;
    created = true;
  }
  if (d.questions.length) {
    const { error } = await db.from("exam_questions").upsert(d.questions.map((q, i) => ({ exam_id: id, question_id: q.id, position: i + 1 })), { onConflict: "exam_id,question_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  if (d.enrol) {
    const { error } = await db.from("enrollments").upsert(candidates.map((c) => ({ exam_id: id, candidate_id: c.id })), { onConflict: "exam_id,candidate_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  return { id, created };
}

// ---------- simulated attempts ----------
type PaperQ = { q: SavedQuestion; aqId: string; options: { id: string; label: string; isCorrect: boolean }[] };

function buildPaper(pool: SavedQuestion[], blueprint?: { easy: number; medium: number; hard: number }): PaperQ[] {
  let chosen = pool;
  if (blueprint) {
    chosen = [];
    for (const level of ["easy", "medium", "hard"] as Diff[]) chosen.push(...shuffled(pool.filter((q) => q.difficulty === level)).slice(0, blueprint[level]));
    chosen = shuffled(chosen);
  }
  return chosen.map((q) => ({
    q,
    aqId: randomUUID(),
    options: shuffled(q.options.map((label, i) => ({ id: q.optionIds[i], label, isCorrect: q.correct.includes(i) }))),
  }));
}

/** Same rules as backend/lib/grading.ts for single + all-or-nothing + partial multi-select. */
function gradeObjective(p: PaperQ, selected: string[]): number {
  const q = p.q;
  if (selected.length === 0) return 0;
  const correct = new Set(p.options.filter((o) => o.isCorrect).map((o) => o.id));
  const penalty = round2(-(q.negative ?? 0));
  if (q.type === "mcq_single") return selected.length === 1 && correct.has(selected[0]) ? q.marks : penalty;
  if (q.scheme === "partial") {
    if (p.options.every((o) => selected.includes(o.id))) return 0;
    const right = selected.filter((id) => correct.has(id)).length;
    const wrong = selected.length - right;
    return round2(q.marks * Math.max(0, (right - wrong) / correct.size));
  }
  const same = selected.length === correct.size && selected.every((id) => correct.has(id));
  return same ? q.marks : penalty;
}

const WRITTEN_GOOD = [
  "A process has its own address space and resources, while threads of one process share memory and are cheaper to create and switch between.",
  "A race condition happens when two threads change shared data at the same time and the result depends on timing. A mutex or semaphore around the critical section prevents it.",
  "Because both sides must confirm they can send and receive and agree on starting sequence numbers before data flows, which avoids old duplicate packets being accepted.",
];
const WRITTEN_WEAK = ["They are the same thing.", "I do not remember this one.", "A thread is faster. A process is slower."];

type SimOptions = {
  exam: Exam;
  def: ExamDef;
  /** how the written answers are handled: all graded, only the first N candidates graded, or none */
  gradedWritten: number;
  autoSubmitIndex?: number;
  skipCandidates?: number; // candidates (from the end) who never started
  abilityFor: (index: number) => number;
};

async function simulate(o: SimOptions) {
  const { exam, def } = o;
  const has = await db.from("attempts").select("id", { count: "exact", head: true }).eq("exam_id", exam.id);
  if (has.error) throw has.error;
  if ((has.count ?? 0) > 0) return console.log(`skip attempts of "${def.title}" (already there)`);

  const attempts: Record<string, unknown>[] = [];
  const aqRows: Record<string, unknown>[] = [];
  const answerRows: Record<string, unknown>[] = [];
  const incidentRows: Record<string, unknown>[] = [];
  const compensations: Record<string, unknown>[] = [];
  const used = candidates.slice(0, candidates.length - (o.skipCandidates ?? 0));

  used.forEach((cand, index) => {
    const attemptId = randomUUID();
    const ability = o.abilityFor(index);
    const startedAt = def.startAt + (5 + Math.floor(rnd() * 25)) * 60_000;
    const endsAt = startedAt + def.durationMin * 60_000;
    const auto = o.autoSubmitIndex === index;
    const submittedAt = auto ? endsAt : startedAt + Math.floor(def.durationMin * (0.55 + rnd() * 0.4)) * 60_000;
    const paper = buildPaper(def.questions, def.blueprint);

    let sum = 0;
    let pendingWritten = false;
    paper.forEach((p, i) => {
      let marksAwarded: number | null = null;
      let graded = null as string | null;
      let feedback: string | null = null;
      const answered = rnd() > 0.06;
      let selected: string[] = [];
      let text = "";
      if (p.q.type === "written") {
        if (answered) text = ability > 0.6 ? pick(WRITTEN_GOOD) : pick(WRITTEN_WEAK);
        if (index < o.gradedWritten) {
          marksAwarded = text === "" ? 0 : ability > 0.6 ? round2(p.q.marks * (0.65 + rnd() * 0.35)) : round2(p.q.marks * rnd() * 0.5);
          marksAwarded = Math.round(marksAwarded * 2) / 2; // half marks only
          graded = examinerId;
          feedback = text === "" ? "No answer given." : marksAwarded >= p.q.marks * 0.7 ? "Clear and correct." : "Partly correct; please give more detail.";
          sum += marksAwarded;
        } else pendingWritten = true;
      } else if (answered) {
        const chance = Math.min(0.97, Math.max(0.05, ability + (p.q.difficulty === "easy" ? 0.15 : p.q.difficulty === "hard" ? -0.25 : 0)));
        const rightIds = p.options.filter((x) => x.isCorrect).map((x) => x.id);
        const wrongIds = p.options.filter((x) => !x.isCorrect).map((x) => x.id);
        selected = rnd() < chance ? rightIds : p.q.type === "mcq_multi" ? shuffled(rightIds).slice(0, 1).concat(shuffled(wrongIds).slice(0, 1)) : [pick(wrongIds)];
        marksAwarded = gradeObjective(p, selected);
        sum += marksAwarded;
      } else {
        marksAwarded = 0;
      }
      aqRows.push({
        id: p.aqId,
        attempt_id: attemptId,
        question_id: p.q.id,
        position: i + 1,
        snapshot: { type: p.q.type, stem: p.q.stem, marks: p.q.marks, difficulty: p.q.difficulty, multiScheme: p.q.scheme ?? "all_or_nothing", negativeMarks: p.q.negative ?? 0, options: p.options },
        marks_awarded: marksAwarded,
        feedback,
        graded_by: graded,
      });
      if (answered) {
        answerRows.push({ attempt_id: attemptId, attempt_question_id: p.aqId, selected_option_ids: selected, text_answer: text, flagged: rnd() < 0.08, client_seq: 1 + Math.floor(rnd() * 3), saved_at: iso(startedAt + Math.floor((submittedAt - startedAt) * rnd())) });
      }
    });

    const finished = !pendingWritten;
    attempts.push({
      id: attemptId,
      exam_id: exam.id,
      candidate_id: cand.id,
      is_sandbox: false,
      status: finished ? "graded" : auto ? "auto_submitted" : "submitted",
      started_at: iso(startedAt),
      ends_at: iso(endsAt),
      compensation_sec: 0,
      submitted_at: iso(submittedAt),
      last_heartbeat_at: iso(submittedAt),
      score: finished ? Math.max(0, round2(sum)) : null,
      paper_difficulty: null,
    });

    // a few believable incidents (indicators only, never proof)
    if (index % 3 === 0) incidentRows.push({ attempt_id: attemptId, type: "tab_hidden", detail: "Tab was hidden for 6 seconds", created_at: iso(startedAt + 12 * 60_000), reviewed: index === 0, reviewer_note: index === 0 ? "Checked with candidate: looked up the exam room number." : null });
    if (index % 4 === 1) incidentRows.push({ attempt_id: attemptId, type: "copy_paste", detail: "Paste event in the answer box", created_at: iso(startedAt + 20 * 60_000), reviewed: false, reviewer_note: null });
    if (index === 2) {
      incidentRows.push({ attempt_id: attemptId, type: "offline", detail: "No heartbeat for 95 seconds", created_at: iso(startedAt + 30 * 60_000), reviewed: false, reviewer_note: null });
      incidentRows.push({ attempt_id: attemptId, type: "resumed", detail: "Connection restored", created_at: iso(startedAt + 32 * 60_000), reviewed: false, reviewer_note: null });
      const isFinal = def.title.includes("Final"); // Final: request still pending (examiner can decide); Midterm: already approved
      compensations.push({ attempt_id: attemptId, gap_sec: 95, status: isFinal ? "pending" : "approved", decided_by: isFinal ? null : examinerId, created_at: iso(startedAt + 32 * 60_000), decided_at: isFinal ? null : iso(startedAt + 40 * 60_000) });
      if (!isFinal) attempts[attempts.length - 1].compensation_sec = 95;
    }
  });

  for (const [table, rows] of [["attempts", attempts], ["attempt_questions", aqRows], ["answers", answerRows], ["incidents", incidentRows], ["compensation_requests", compensations]] as [string, Record<string, unknown>[]][]) {
    if (rows.length === 0) continue;
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db.from(table).insert(rows.slice(i, i + 200));
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  }
  console.log(`ok  ${attempts.length} attempts, ${aqRows.length} paper questions, ${answerRows.length} answers, ${incidentRows.length} incidents for "${def.title}"`);
}

// ---------- build everything ----------
const dbQs = await ensureQuestions("Database Systems", DB_POOL);
const netQs = await ensureQuestions("Computer Networks", NET_QUIZ);
const osQs = await ensureQuestions("Operating Systems", OS_FINAL);
const seQs = await ensureQuestions("Software Engineering", SE_PRACTICE);
console.log("ok  question bank: 4 topics,", dbQs.length + netQs.length + osQs.length + seQs.length, "questions");

// A: finished, graded, results PUBLISHED, random papers from a blueprint (innovation 5.2)
const A: ExamDef = {
  title: "Database Systems - Midterm",
  instructions: "Answer all questions. Each paper is drawn at random from the question pool with the same mix of easy, medium and hard questions. Negative marking applies to single-answer questions.",
  startAt: now - 3 * DAY, endAt: now - 3 * DAY + 3 * HOUR, durationMin: 60, totalMarks: 30, passMarks: 15,
  status: "published", blueprint: { easy: 4, medium: 4, hard: 2 }, questions: dbQs, enrol: true,
};
// C: finished, results NOT published yet: some written answers still waiting for the examiner
const C: ExamDef = {
  title: "Operating Systems - Final",
  instructions: "Written answers are graded by the examiner. Results are published after grading.",
  startAt: now - 1 * DAY, endAt: now - 1 * DAY + 3 * HOUR, durationMin: 90, totalMarks: 24, passMarks: 12,
  status: "published", shuffleQuestions: false, questions: osQs, enrol: true,
};
// B: running now (long window so it is still open during the evaluation)
const B: ExamDef = {
  title: "Computer Networks - Quiz 2",
  instructions: "You have 30 minutes once you start. Your answers are saved automatically; if your connection drops, keep working and they will sync when it returns.",
  startAt: now - 1 * HOUR, endAt: now + 3 * DAY, durationMin: 30, totalMarks: 20, passMarks: 10,
  status: "published", shuffleQuestions: true, questions: netQs, enrol: true,
};
// D: upcoming
const D: ExamDef = {
  title: "Software Engineering - Practice Test",
  instructions: "A short practice test on Scrum, UML and testing. It is not graded towards your course mark.",
  startAt: now + 4 * DAY, endAt: now + 4 * DAY + 2 * HOUR, durationMin: 30, totalMarks: 16, passMarks: 8,
  status: "published", questions: seQs, enrol: true,
};
// E: draft, empty (the examiner builds it live in the demo)
const E: ExamDef = {
  title: "Web Technologies - Quiz (draft)",
  instructions: "",
  startAt: now + 7 * DAY, endAt: now + 7 * DAY + 2 * HOUR, durationMin: 20, totalMarks: 10, passMarks: 5,
  status: "draft", questions: [], enrol: false,
};

const examA = await ensureExam(A, false);
const examC = await ensureExam(C, false);
await ensureExam(B, true);
await ensureExam(D, true);
await ensureExam(E, true);

const abilityA = [0.9, 0.72, 0.55, 0.8, 0.4, 0.65, 0.85, 0.5, 0.6, 0.7, 0.3];
await simulate({ exam: examA, def: A, gradedWritten: 99, abilityFor: (i) => abilityA[i % abilityA.length] });
const abilityC = [0.85, 0.6, 0.45, 0.75, 0.9, 0.35, 0.7, 0.55, 0.5, 0.65, 0.4];
await simulate({ exam: examC, def: C, gradedWritten: 4, autoSubmitIndex: 5, skipCandidates: 2, abilityFor: (i) => abilityC[i % abilityC.length] });

// publish A's results (only when still unpublished) + a sample verification code
const a = await findExam(A.title);
if (a && !a.results_published_at) {
  const { error } = await db.from("exams").update({ results_published_at: iso(A.endAt + 2 * HOUR) }).eq("id", a.id);
  if (error) throw error;
  console.log("ok  results of the Midterm are published");
}
if (a) {
  const aliId = ids.get("ali@demo.com")!;
  const att = await db.from("attempts").select("id").eq("exam_id", a.id).eq("candidate_id", aliId).eq("is_sandbox", false).maybeSingle();
  if (att.data) {
    const have = await db.from("report_verifications").select("code").eq("attempt_id", att.data.id).maybeSingle();
    let code = have.data?.code as string | undefined;
    if (!code) {
      const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      code = Array.from({ length: 10 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
      const { error } = await db.from("report_verifications").insert({ attempt_id: att.data.id, code });
      if (error) throw error;
    }
    console.log(`ok  sample verification code (Ali, Midterm): ${code}   -> /api/verify/${code}`);
  }
}

// announcement on the running exam
const b = await findExam(B.title);
if (b) {
  const have = await db.from("announcements").select("id", { count: "exact", head: true }).eq("exam_id", b.id);
  if ((have.count ?? 0) === 0) {
    const { error } = await db.from("announcements").insert({ exam_id: b.id, message: "Welcome! Please keep this tab in the foreground and make sure your charger is connected.", created_by: examinerId });
    if (error) throw error;
  }
}

console.log("\nDone. Demo data is ready:");
console.log("  Midterm (finished, results published) | Final (finished, written answers waiting to be graded)");
console.log("  Quiz 2 (open now, 3 days) | Practice Test (starts in 4 days) | Web quiz (draft)");
console.log(`  Logins: admin@demo.com, examiner@demo.com, ali@demo.com ... (password ${PASSWORD})`);
