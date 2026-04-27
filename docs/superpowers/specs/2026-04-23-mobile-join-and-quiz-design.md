# Mobile Join Fix + Post-Roleplay Quiz — Design

**Date:** 2026-04-23
**Status:** Draft, awaiting user review

## Problem

Two issues in the DUZZ Live (Kahoot-style) feature:

1. **Mobile users can't join games.** On mobile browsers, the page renders zoomed out at a desktop canvas width, so the join form is a tiny sliver and essentially unusable. Users perceive this as "can't join."
2. **No post-roleplay knowledge check.** The roleplay score alone drives the leaderboard. The user wants a 10-question multiple choice quiz after the roleplay, averaged with the roleplay score for the final ranking.

## Part 1 — Mobile Viewport Fix

### Root Cause

`src/app/layout.tsx` defines `metadata` but has no `viewport` export and no `<meta name="viewport">` tag. Without a viewport directive, iOS Safari and Android Chrome render the page at their default 980px-ish desktop canvas and zoom out to fit. The `max-w-sm` join form becomes a ~60px wide sliver with un-tappable controls.

### Fix

Add a `viewport` export to `src/app/layout.tsx`:

```ts
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};
```

This is a one-file change that fixes every page in the app, not just `/play`. Next.js 15+/16 emits the correct `<meta name="viewport">` tag from this export.

### Verification

- Load `/play` on mobile (iOS Safari, Android Chrome): form fills the screen with full-size inputs and buttons.
- Tap through 3-step wizard: no layout shift, no hidden elements.
- No regressions on desktop (`max-w-sm` is still respected because viewport width = device width).

## Part 2 — Post-Roleplay Multiple Choice Quiz

### Flow

```
PREP → PRESENTING → FOLLOWUP → [NEW] QUIZ → RESULTS
```

The quiz appears after the user finishes their roleplay (`handleFinishRoleplay`) and *before* the final results screen. The backend grades the roleplay, generates the quiz, and the user answers 10 questions. On submit, the backend computes the combined score and marks the participant complete.

### Question Generation

- 10 multiple-choice questions, 4 options each, exactly one correct.
- Generated per participant by Claude Haiku at the moment roleplay grading starts (parallel generation so the user doesn't wait extra).
- Prompt seeds Haiku with the event's **cluster** (Marketing, Finance, Hospitality, Business Management, Entrepreneurship, Personal Finance Literacy) and the event's `description` so questions match the event domain — mimicking actual DECA cluster exam content.
- Format enforced via JSON: `{ questions: [{ prompt, options: [4 strings], correctIndex }] }`.
- Questions cached on `LiveParticipant.quizQuestionsJson` so a page refresh doesn't re-roll them.

### Scoring

- Quiz score = `(correctCount / 10) * 100` → 0–100 integer.
- **Final score** = `(roleplayScore + quizScore) / 2`, rounded to 1 decimal.
- `LiveParticipant.totalScore` stores the final combined score (what the leaderboard sorts by). Roleplay and quiz components stored separately for display:
  - `LiveParticipant.roleplayScore: Float?`
  - `LiveParticipant.quizScore: Float?`
  - `LiveParticipant.quizAnswersJson: String?` (user's selections, for results screen review)
- No timer per question (per user decision). User answers at their own pace, submits when all 10 are answered.

### Data Model Changes

Add to `LiveParticipant` in `prisma/schema.prisma`:

```prisma
quizQuestionsJson String?   // JSON: [{prompt, options, correctIndex}]
quizAnswersJson   String?   // JSON: [number, number, ...] user's selected indices
quizScore         Float?    // 0-100
roleplayScore     Float?    // 0-100, split out from totalScore
```

`totalScore` semantics change: it now means the **combined** final score (average). During the interim (roleplay done, quiz not done), `totalScore` stays null so the participant doesn't appear on the leaderboard yet.

Migration: `npx prisma migrate dev --name add-quiz-fields`.

### API Changes

**`POST /api/live-session/roleplay` — `action: "end_session"`** (existing):

After grading roleplay:
1. Store `roleplayScore` on participant.
2. Call Haiku to generate 10 MCQs for the event's cluster (parallel with grading, or serial — both OK since this is one request).
3. Store `quizQuestionsJson`.
4. Return the score **plus** the quiz questions to the client.
5. Do **not** mark `completed: true` yet.
6. Do **not** set `totalScore` yet.

**`POST /api/live-session/roleplay` — `action: "submit_quiz"`** (new):

Body: `{ participantId, answers: number[] }` (length 10).
- Validate: participant belongs to caller (cookie), quiz not already submitted, `answers.length === 10`.
- Load `quizQuestionsJson`, score by comparing to `correctIndex`.
- Compute final: `(roleplayScore + quizScore) / 2`.
- Update: `quizAnswersJson`, `quizScore`, `totalScore`, `completed: true`, `completedAt: now()`.
- Return: `{ quizScore, roleplayScore, totalScore, correctAnswers: number[] }` for the results screen.

### UI Changes

**`RoleplaySessionUI.tsx`:**
- New phase `"quiz"` inserted between `followup` and `results`.
- New `RoleplayQuiz` sub-component receives `questions`, renders them one at a time with a progress bar (1/10, 2/10…) — single-column layout, large tap targets, works on mobile.
- On submit, calls `onSubmitQuiz(answers)` (new prop).
- Results screen additions: shows both roleplay score and quiz score as two numbers, then the combined final, plus a per-question review (green/red for correct/wrong, with the right answer shown).

**`src/app/play/[participantId]/page.tsx`:**
- Adds `onSubmitQuiz` prop that POSTs `action: "submit_quiz"` to the live-session roleplay endpoint.

**Type changes in `RoleplaySessionUI.tsx`:**
- Extend `RoleplayScore` to include optional `quizScore`, `combinedScore`, `quizReview: { prompt, options, correctIndex, userIndex }[]`.
- `RoleplaySessionData` gets `quizQuestions?: Array<{prompt, options}>` (no `correctIndex` — server keeps that secret until submit).

### Leaderboard

No code changes needed. `GET /api/live-session/leaderboard` already sorts by `totalScore desc, completedAt asc`. Since `totalScore` is only written after quiz submission, the leaderboard naturally only shows participants who finished both phases.

### Out of Scope

- Authenticated `/roleplay` flow (individual user roleplays) — not changed. Quiz is only for live sessions per the "Kahoot thing" scope.
- Retake / resubmit — one attempt per participant (matches existing roleplay semantics).
- Static question bank — AI-generated per user decision.
- Host-side quiz customization — not requested.

## Testing

Manual verification:
- `npm run lint && npm run build` pass.
- Mobile (iOS Safari + Android Chrome via DevTools device emulation): 3-step join works, quiz screen usable with large tap targets.
- End-to-end: create live session as host, join as participant, finish roleplay, answer quiz, verify leaderboard shows combined score.
- Edge cases: refresh mid-quiz should reload same questions; submitting before all answered should be blocked client-side and server-side.

## Files Changed

- `src/app/layout.tsx` — add `viewport` export (mobile fix).
- `prisma/schema.prisma` — add 4 fields to `LiveParticipant`.
- `src/lib/ai/live-roleplay.ts` — add `generateQuiz(eventCode)` helper.
- `src/app/api/live-session/roleplay/route.ts` — generate + cache quiz on `end_session`, handle new `submit_quiz` action.
- `src/components/roleplay/RoleplaySessionUI.tsx` — new quiz phase + review on results.
- `src/app/play/[participantId]/page.tsx` — wire `onSubmitQuiz` prop.
