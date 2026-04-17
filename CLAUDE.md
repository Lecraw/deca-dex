# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DUZZ (deca-dex) is a Next.js full-stack app that helps high school students build DECA competition projects using AI-powered tools. Features include idea generation, AI-assisted research documents, written reports, AI feedback, judge simulation, roleplay practice, compliance checking, and gamification (XP/badges/leaderboard).

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npx prisma migrate dev` — run database migrations
- `npx prisma generate` — regenerate Prisma client (also runs on `npm install` via postinstall)

## Architecture

**Framework:** Next.js 16 with App Router, React 19, TypeScript strict mode.

**Route groups:**
- `src/app/(app)/` — authenticated pages (dashboard, projects, roleplay, planner, leaderboard, profile)
- `src/app/(auth)/` — login page
- `src/app/api/` — REST API routes
- `src/app/events/` — public events page

**Project flow:** A user creates a Project linked to a DecaEvent. Each project gets ResearchDocuments (6 preset templates). Written report projects also get ReportSections. Pitch deck projects upload their presentation externally. The project detail page shows a guided workflow: Idea → Research → Plan → Build → Feedback → Compliance → Judge Sim.

**Event types:** PITCH_DECK events (EIP, ESB, IMCE, IMCP, IMCS, SMG) create slides externally. WRITTEN_REPORT events (EIB, IBP, EBG, EFB, PMBS, PMCD, PMCA, PMCG, PMFL, PMSP) use the in-app report editor.

**Compliance vs Judge Sim:** Compliance is a pass/fail guideline checklist (no scoring). Judge Sim provides numeric scoring using the event rubric.

**Key directories:**
- `src/lib/` — shared utilities: `auth.ts` (NextAuth config), `prisma.ts` (DB client), `anthropic.ts` (Claude SDK), `ai/prompts.ts` (all AI system prompts), `research-templates.ts` (preset research template definitions)
- `src/components/ui/` — shadcn/ui components (base-nova style, lucide icons)
- `src/providers/index.tsx` — wraps app in ThemeProvider → SessionProvider → QueryClientProvider → TooltipProvider
- `src/generated/prisma/` — auto-generated Prisma client (do not edit)
- `prisma/schema.prisma` — database schema (SQLite via Turso LibSQL)

**Path alias:** `@/*` maps to `src/*`.

## Tech Stack Details

- **Database:** SQLite via Turso LibSQL, Prisma ORM. Generated client outputs to `src/generated/prisma/`.
- **Auth:** NextAuth.js 4 with Prisma adapter, JWT strategy. OAuth providers (Google, GitHub) are optional; credentials always available.
- **AI:** Anthropic SDK using Claude models. System prompts are centralized in `src/lib/ai/prompts.ts`. AI endpoints use streaming responses.
- **Styling:** Tailwind CSS v4 with `@tailwindcss/postcss`. Dark theme by default. CSS variables for theming.
- **State:** TanStack React Query for server state (60s staleTime, no refetch on window focus). Zustand available for client state.
- **File storage:** Supabase for uploads.
- **Exports:** docx/pptxgenjs for document generation.
- **Deployment:** Netlify with `@netlify/plugin-nextjs`.

## Environment Variables

See `.env.example`. Required: `DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. OAuth vars are optional.

## Conventions

- API routes use `getServerSession()` for auth checks and return appropriate HTTP status codes (401, 400, 404).
- AI API routes stream responses to avoid Netlify function timeouts.
- shadcn components are added via `npx shadcn@latest add <component>` — config is in `components.json`.
- Domain types live in `src/types/deca.ts`; NextAuth type augmentation in `src/types/next-auth.d.ts`.
