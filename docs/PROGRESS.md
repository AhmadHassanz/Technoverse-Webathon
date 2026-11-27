# Progress Log

Claude updates this file at the end of every task, so a new session can pick up right where we left off.

## Current status
- Next.js 16 + TypeScript + Tailwind app created in `D:\TECHNOVERSE_WEBATHON\webathon` (= git repo root). Starter page only; `npm run build` passes.
- Git: NOT a git repo right now (history deleted on purpose). `git init` on 27 Nov after 10:00 AM.
- Problem statement: **not decided yet**.

## Done
- 2026-11-26: Set up CLAUDE.md + PROGRESS.md for memory between sessions.
- 2026-11-26: Created Next.js app (`webathon/`), moved CLAUDE.md + PROGRESS.md into it so they're shared via git. Build OK.
- 2026-11-26: Frontend/backend split: BACKEND.md, FRONTEND.md, CONTRACT.md (template + GET /api/health), lib/types.ts, lib/api-response.ts (ok/fail), lib/api-client.ts (apiGet/apiPost), app/api/health/route.ts, empty components/ + lib/data/. Build + lint pass. Not committed yet.
- 2026-11-26: Reorganized into `frontend/` (friend), `backend/` (user), `shared/types.ts`; `app/` now only has 1-line connector files. Guides + CONTRACT.md updated. Build + lint pass.
- 2026-11-26: Tidied root: moved BACKEND/FRONTEND/CONTRACT/PROGRESS.md into `docs/` (DESIGN.md goes there too). CLAUDE.md, AGENTS.md, README.md must stay at root.

## Next steps
1. ✅ Git name/email set, GitHub CLI logged in as AhmadHassanz (26 Nov).
2. On 27 Nov after 10:00 AM: `git init`, first commit, create GitHub repo, push, add friend as collaborator.
3. Get the problem statement, write it into CLAUDE.md, then add the real endpoints to CONTRACT.md + shared/types.ts.
4. First deploy to Vercel and put the live link in the README.

## Decisions
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
