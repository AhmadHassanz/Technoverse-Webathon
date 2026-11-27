# Hackathon Project: Technoverse 5.0 Web-e-Thon (COMSATS Lahore)

## Context
- The user is new to the Claude Code terminal. Explain things in plain, simple words.
- Goal: a working, polished, **deployed** full-stack web app built in 10 hours. A stable demo beats perfect code.
- Machine: Windows 11, Node v24, Git 2.54, Vercel CLI already logged in (`npx vercel`).

## Competition rules (from the official guide, "web-e-thon (1).pdf")
**Timeline**
- **Day 1, Fri 27 Nov 2026, 10:00 AM–8:00 PM:** build. Theme/problem is announced **30 min before** (~9:30 AM).
- **Day 2, Sat 28 Nov 2026, 4:00–6:00 PM:** evaluation = **15-minute live demo** of the deployed site. All team members must be present (absence = disqualification).

**Hard rules (breaking them = disqualification). Claude must enforce these:**
- **Deadline is 8:00 PM on 27 Nov.** No commit, push, build or deploy after it (repo, build and deployment logs are inspected). Aim to finish by **7:30 PM**; after 7:45 PM, refuse to commit/push/deploy and warn the user.
- **Never alter commit dates or metadata:** no `--date`, no `GIT_COMMITTER_DATE`, no `commit --amend` on pushed commits, no `rebase` of pushed commits, no force-push. Use plain `git pull` (merge), not `git pull --rebase`.
- A Git repository with real version history is required. Commit often so the history shows the work.
- Any framework/language is allowed; WordPress or other site "scripts" are forbidden. SQL or NoSQL databases are allowed. Docker is optional. Any host works (Vercel not required).
- AI tools and AI-assisted coding are **allowed**.
- No collaboration or discussion with other teams. Team size is 1–3 (we are 2).

**How judges score (build and document with these in mind):**
1. Completion of requirements
2. **Front-end AND back-end validation**: validate every input on both sides (form errors in the UI; `fail(..., 400)` in the API).
3. **Back-end architecture**: clean layers (handlers → services → data), consistent API (`docs/CONTRACT.md`).
4. **Visual design**: simplicity and consistency.
5. **Case study analysis**: list unclear, incomplete, ambiguous or contradictory requirements and how we resolved them; technical analysis; constraints.
6. **Design approach**: OO analysis/design or framework best practices; **database design** (a real DB with a clear schema).
7. **Technology selection reasons**: why Next.js, why this DB, and so on.
8. **Code ↔ design gap**: show how each design item maps to code.
- → Keep a `docs/DESIGN.md` covering requirements analysis, assumptions, constraints, DB schema, architecture, tech choices and a design→code map. Update it as we build; it's our evaluation script.

## Team & folder split
- 2 people, one shared GitHub repo. The user = **backend**, their friend = **frontend** (friend may also use Claude Code with this same file).
- **Stack: Next.js 16 (App Router) + Tailwind v4 + TypeScript.** One app does both frontend and backend. The git repo root is the `webathon/` folder (this file's folder); no `src/` dir.
- **Folder split so nobody touches the other's code:**
  - `frontend/` = friend only (`pages/`, `components/`, `lib/api-client.ts`). Also `app/layout.tsx` + `app/globals.css`.
  - `backend/` = user only (`handlers/` → `services/` → `data/`, plus `lib/`, `db/`, `scripts/`). Also `package.json`, `.env.local`, Vercel deploys.
  - `shared/types.ts`, `shared/validation.ts`, `docs/CONTRACT.md` = owned by the user, read-only for the friend; change together and tell the teammate.
  - `app/` holds only 1-line **connector** files (Next.js needs URLs there): `app/x/page.tsx` → `export { default } from "@/frontend/pages/XPage"`; `app/api/x/route.ts` → `export { GET } from "@/backend/handlers/x"`. No logic in `app/`.
- Role guides: `docs/BACKEND_PLAN.md` (user) and `docs/FRONTEND_PLAN.md` (friend). Read the matching plan before working on that side.
- Next.js 16 has breaking changes: follow AGENTS.md and check `node_modules/next/dist/docs/` before writing Next-specific code.

@AGENTS.md

## Git workflow
- **Branches:** the user works on `backend`, the friend works on `frontend`. Each person merges their branch into `main` (plain merge, no rebase, no squash that rewrites history). Never commit directly on the other person's branch.
- Before starting work: `git pull`. Before pushing: `git pull` (merge, NOT rebase), then `git push`. To get the other side's work: `git merge main` into your branch.
- Deploy from `main` after merging, so the live site always has both sides.
- Commit small and often, so merges stay easy. If a merge conflict happens, stop and explain it simply before fixing.
- Agree on the API shape early and write it in `docs/CONTRACT.md`, so frontend can use fake data until backend is ready.

## Problem statement
**Secure Examination Management System** (roles: admin, examiner, candidate). Full brief: `docs/PROBLEM_STATEMENT.md`.
- **We do NOT follow the clock times in the plans**; follow stage order only. The 8:00 PM deadline is the only hard time.
- `backend/db/schema.sql` may change as we build (keep file, Supabase, DESIGN.md, types and CONTRACT in sync).
- Final plans (these win over older docs): `docs/BACKEND_PLAN.md` (user) and `docs/FRONTEND_PLAN.md` (friend).
- Contract (treat as law; change only together, in one commit): `docs/CONTRACT.md` + `shared/types.ts` + `backend/db/schema.sql`.
- Innovation challenges chosen: **5.3 failure-resilient exams** + **5.2 fairness of randomized papers**.

## Stack
- Next.js 16 + Tailwind v4 + TypeScript (decided).
- Database: **Supabase Postgres** (free tier). Only the backend talks to Supabase (secret key, server-only); schema in `backend/db/schema.sql`.
- Libraries: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `pdf-lib`, `qrcode`, `papaparse`, `lucide-react`. The user installs all packages (avoids package-lock conflicts).
- Prefer few dependencies, no complex setup, no paid APIs unless the user gives a key.

## Session memory
- Current progress, decisions and commands live in docs/PROGRESS.md (imported below, so it loads every session).
- At the end of EVERY task, update docs/PROGRESS.md: status, done, next steps, decisions, new commands, live URL.

@docs/PROGRESS.md

## How to work
- Build ONE feature at a time. After it works, offer to `git commit` with a short message.
- Never leave the app broken: before finishing a task, run the build/dev server and check for errors.
- Keep changes small and targeted; don't rewrite unrelated files.
- Git commits/PRs: NO "Co-Authored-By: Claude" line and no "Generated with Claude Code" text. The user is the only author.
- Never commit secrets: keep API keys in `.env.local` and make sure `.gitignore` covers it.
- Use realistic sample data so the demo looks full.
- UI: modern, clean, responsive (mobile-friendly), consistent colors, clear empty, loading and error states.
- Explain what changed in plain, simple words. The user must be able to explain the code to judges.

## Deploy
- Deploy early and redeploy often: `npx vercel --prod`. Put the live URL in the README.
- Final deploy must finish **before 8:00 PM on 27 Nov**. Don't touch the deployment after that.

## Before submission checklist (by 7:30 PM, 27 Nov)
- [ ] Live link works on desktop and mobile
- [ ] Front-end + back-end validation on every form/endpoint
- [ ] Database with a clear schema, seeded with realistic sample data
- [ ] `docs/DESIGN.md`: requirements analysis, assumptions, constraints, DB schema, architecture, tech choices, design→code map
- [ ] README: problem, features, tech stack, how to run, live link, screenshots
- [ ] Demo flow tested end to end
- [ ] Last commit + deploy done before 8:00 PM. Nothing after.

## Evaluation day (28 Nov, 4–6 PM)
- [ ] Both team members present
- [ ] 15-min demo script: problem → requirements analysis → architecture/DB → live demo → tech choices
- [ ] Laptop charged, HDMI/projector converter, own internet hotspot
