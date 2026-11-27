# Progress Log

Claude updates this file at the end of every task, so a new session can pick up right where we left off.

## Current status
- Project: **Secure Examination Management System** (`docs/PROBLEM_STATEMENT.md`). Plans: `docs/BACKEND_PLAN.md`, `docs/FRONTEND_PLAN.md`. Contract: `docs/CONTRACT.md`, `shared/types.ts`, `backend/db/schema.sql`.
- Repo: https://github.com/AhmadHassanz/Technoverse-Webathon. Branches: `main` (merged, deployable), `backend` (user), `frontend` (friend).
- Stage: about to start **Stage 0** of BACKEND_PLAN (behind schedule: plan said 10:50–11:30).

## Done
- 27 Nov 10:25: `git init`, first commit, pushed `main`.
- 27 Nov 11:09: added problem statement, backend/frontend plans, contract, `shared/types.ts`, `backend/db/schema.sql`; CLAUDE.md filled in.
- 27 Nov: created `backend` branch; removed unused boilerplate (3 starter SVGs, personal `.vscode/`, old quick-reference guides); wrote real README and `docs/DESIGN.md` skeleton.

## Next steps
1. Stage 0 (BACKEND_PLAN): user creates Supabase project, runs `schema.sql`, fills `.env.local` (+ Vercel env vars).
2. Stage 0 (Claude): install all packages in one commit, `backend/lib` helpers (errors, supabase, auth, time, shuffle), Stage 1+2 stub endpoints, `npm run build`, first deploy.
3. Add friend as GitHub collaborator; friend creates `frontend` branch from `main`.
4. Friend: when replacing `HomePage.tsx`, also delete `public/next.svg` and `public/vercel.svg` (only the starter page uses them).

## Decisions
- Team of 2: user = backend (branch `backend`), friend = frontend (branch `frontend`). Merge into `main`, deploy from `main`.
- Stack: Next.js 16 (App Router) + Tailwind v4 + TypeScript, ONE app, repo root = `webathon/`, no `src/`.
- DB = Supabase Postgres; auth via Supabase behind our API (httpOnly cookie); backend uses the secret key only; RLS on with no policies.
- Polling instead of Realtime; pdf-lib + qrcode for PDFs; zod schemas in `shared/validation.ts`.
- Innovation challenges: 5.3 (outage compensation) + 5.2 (blueprint fairness).
- Folders: `frontend/` (friend), `backend/` (user), `shared/` + `CONTRACT.md` (user owns, both use). `app/` = 1-line connectors only.
- API format: `{ data }` on success, `{ error, fields? }` on failure.
- Commits: no Claude co-author lines. (The first two commits on `main` have one by mistake; left as-is because pushed history must not be rewritten.)
- Cache Components is ON in next.config.ts → no `export const dynamic`; use `await connection()` for live GET data.

## Useful commands
| What | Command |
|---|---|
| Open Claude Code in the right folder | `cd D:\TECHNOVERSE_WEBATHON\webathon` then `claude` |
| Start dev server | `npm run dev` → http://localhost:3000 |
| Build (check for errors) | `npm run build` |
| Deploy live (from `main`) | `npx vercel --prod` |
| Save work | `git add . && git commit -m "message"` then `git push` |
| Get the other side's work into your branch | `git pull` then `git merge main` |
| Merge your branch into main | `git switch main && git pull && git merge backend && git push && git switch backend` |

## Live URL
- (not deployed yet)
