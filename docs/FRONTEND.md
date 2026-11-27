# Frontend Quick Reference (owner: friend)

**Full plan: `docs/FRONTEND_PLAN.md`** (routes, design tokens, workspace spec, stages, prompts). **Figma screens: `docs/FIGMA_PLAN.md`** (design order, frame list, handoff checklist). Contract: `docs/CONTRACT.md` + `shared/types.ts` (read-only for you — ask the backend owner for changes).

## Your files
- `frontend/pages/<Name>Page.tsx` — one component per screen.
- `frontend/layouts/` — role layouts with guards (Admin / Examiner / Candidate).
- `frontend/components/` — `ui/` (shadcn), `shell/`, `exam/`, `charts/`. Add a shadcn component with `npx shadcn@latest add button`. Import: `import { Button } from "@/frontend/components/ui/button"`.
- `frontend/lib/` — `api-client.ts`, `auth.tsx`, `format.ts`, `mock.ts`, workspace hooks.
- `app/layout.tsx`, `app/globals.css`, and page/layout connector files in `app/` (not `app/api`).

## How a URL shows your page
```tsx
// app/examiner/exams/[examId]/page.tsx  → URL /examiner/exams/:examId
export { default } from "@/frontend/pages/ExamPage";
```

## Rules
- Call the backend only through `api-client.ts`, typed with `@/shared/types`. Build against mock data first, swap when the endpoint is ✅ in CONTRACT.md.
- `"use client";` on line 1 for components with state/effects/handlers. `useParams`/`useSearchParams` inside `<Suspense>`.
- Every data screen: loading (skeleton), empty, error (+ Retry), data.
- Only the design tokens from FRONTEND_PLAN section 5. No new colours, no emoji, no gradients.
- Don't install packages yourself — ask the backend owner (avoids package-lock conflicts).
