# Progress Log

Claude updates this file at the end of every task, so a new session can pick up right where we left off.

## Current status
- Next.js 16 + TypeScript + Tailwind app created in `D:\TECHNOVERSE_WEBATHON\webathon` (= git repo root). Starter page only; `npm run build` passes.
- Git: repo initialized 27 Nov 10:25 AM, pushed to https://github.com/AhmadHassanz/Technoverse-Webathon (branch `main`).
- Problem statement: **Secure Examination Management System** (`docs/PROBLEM_STATEMENT.md`). Plans: `docs/BACKEND_PLAN.md`, `docs/FRONTEND_PLAN.md`. Contract: `docs/CONTRACT.md`, `shared/types.ts`, `backend/db/schema.sql`.
- Stage: about to start **Stage 0** of BACKEND_PLAN (Supabase project, packages, backend/lib helpers, stubs, first deploy).
- shadcn is installed (Nova + Base UI). Button lives in `frontend/components/ui/`. `npx shadcn@latest add <name>` adds more there.

## Done
- 2026-11-27: Installed shadcn (`npx shadcn@latest init --defaults`). Packages: `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `shadcn`, `tw-animate-css`. Components go in `frontend/components/ui/`. Geist is wired to `--font-sans`.
- 2026-11-27: Added docs/PROBLEM_STATEMENT.md, BACKEND_PLAN.md, FRONTEND_PLAN.md, new CONTRACT.md, shared/types.ts, backend/db/schema.sql; updated CLAUDE.md + quick-reference guides.
- 2026-11-26: Set up CLAUDE.md + PROGRESS.md for memory between sessions.
- 2026-11-26: Created Next.js app (`webathon/`), moved CLAUDE.md + PROGRESS.md into it so they're shared via git. Build OK.
- 2026-11-26: Frontend/backend split: BACKEND.md, FRONTEND.md, CONTRACT.md (template + GET /api/health), lib/types.ts, lib/api-response.ts (ok/fail), lib/api-client.ts (apiGet/apiPost), app/api/health/route.ts, empty components/ + lib/data/. Build + lint pass. Not committed yet.
- 2026-11-26: Reorganized into `frontend/` (friend), `backend/` (user), `shared/types.ts`; `app/` now only has 1-line connector files. Guides + CONTRACT.md updated. Build + lint pass.
- 2026-11-26: Tidied root: moved BACKEND/FRONTEND/CONTRACT/PROGRESS.md into `docs/` (DESIGN.md goes there too). CLAUDE.md, AGENTS.md, README.md must stay at root.

## Next steps
1. ✅ Git name/email set, GitHub CLI logged in as AhmadHassanz (26 Nov).
2. ✅ 27 Nov: `git init`, first commit, pushed to GitHub. TODO: add friend as collaborator.
3. ✅ 27 Nov: problem statement + plans + contract + schema + types added to repo.
4. Stage 0 (BACKEND_PLAN): create Supabase project, run schema.sql, `.env.local` + Vercel env vars, install packages (one commit), backend/lib helpers, Stage 1+2 stubs, first deploy.

## Decisions
- 27 Nov: UI kit = shadcn (user asked to install it). Overrides the earlier "no shadcn CLI" line in FRONTEND_PLAN.
- 27 Nov: DB = Supabase Postgres, auth via Supabase behind our API (httpOnly cookie), polling not Realtime, pdf-lib + qrcode for PDFs, zod in shared/validation.ts. Innovation 5.3 + 5.2.
- Team of 2: user = backend, friend = frontend. One GitHub repo, user owns it, friend added as collaborator.
- Stack: Next.js 16 (App Router) + Tailwind v4 + TypeScript, repo root = `webathon/`, no `src/`. ONE app, one deploy.
- Folders: `frontend/` (friend), `backend/` (user), `shared/` + `CONTRACT.md` (both). `app/` = connector files only. (User rejected two separate apps.)
- API contract goes in `CONTRACT.md` (Claude writes it once the problem statement is known).
- No Claude co-author lines in commits.
- API response format: `{ data }` on success, `{ error }` on failure (see CONTRACT.md).
- 2026-11-26: Deleted `.git` (it only held create-next-app's automatic "Initial commit" dated 26 Nov). Run `git init` + first commit only AFTER 10:00 AM on 27 Nov. No commits before that.
- Read the official rules PDF and added them to CLAUDE.md: 8:00 PM deadline on 27 Nov, no timestamp changes, plain `git pull` (not rebase), DB design + validation + DESIGN.md are scored.
- Cache Components is ON in next.config.ts → no `export const dynamic`; use `await connection()` for live GET data.

## Useful commands
| What | Command |
|---|---|
| Open Claude Code in the right folder | `cd D:\TECHNOVERSE_WEBATHON\webathon` then `claude` |
| Start dev server (inside `webathon/`) | `npm run dev` → http://localhost:3000 |
| Build (check for errors) | `npm run build` |
| Deploy live | `npx vercel --prod` |
| Save work | `git add . && git commit -m "message"` |
| Get teammate's work (merge, never rebase) | `git pull` |

## Live URL
- (not deployed yet)
