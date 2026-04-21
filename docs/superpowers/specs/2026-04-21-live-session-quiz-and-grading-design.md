# Live Session: Softer Grading + 10-Question DECA Quiz

**Date:** 2026-04-21
**Scope:** The live-session ("kahoot-style") roleplay feature under `/play/*` and `/host/*`.

## Goals

1. Recalibrate roleplay grading so it matches how real DECA judges actually score (fair, not brutal).
2. After the roleplay, participants answer 10 multiple-choice DECA knowledge questions. The quiz score is added to their roleplay score and both feed the session leaderboard.

## 1. Grading recalibration

**File:** `src/lib/ai/live-roleplay.ts`, function `gradeRoleplay` (current harshness lives in the system prompt at lines 208–225).

**Current prompt behavior:** Instructs the judge to "be STRICT", score minimal responses at 0–20, and explicitly "DO NOT inflate scores". Result is that typical student efforts score in the 20–50 range, which feels punishing and unlike actual DECA feedback.

**New calibration (replaces the `CRITICAL SCORING RULES` block):**

- Real DECA judges are fair and constructive. They see dozens of students per day and scores cluster based on the rubric levels, not on harshness.
- A student who addresses most PIs with clear reasoning and professional delivery should land in **70–85** (Meets / high Meets).
- Thorough, well-structured, confident responses that clearly demonstrate all PIs earn **85–95** (Exceeds).
- A perfect 100 remains rare — reserved for polished, specific, well-reasoned responses that would impress at a district-level judging panel.
- Short, vague, or partially-on-topic responses score in the **40–60** range (Below Expectations), not 0–20.
- Only genuinely empty, off-topic, or incoherent transcripts score below 40.
- Feedback tone: lead with what worked, then identify specific improvement areas. Avoid dismissive language.
- Speech-to-text tolerance stays unchanged (focus on substance, ignore transcription artifacts).

**No structural changes.** Same JSON output, same `totalScore` 0–100, same `piScores`/`twentyFirstCenturyScores`/`strengths`/`improvements` shape.

## 2. Quiz generation (host-create time)

**New function:** `generateQuiz(event, stream)` in `src/lib/ai/live-roleplay.ts`.

- Uses the same Haiku model as `generateScenario`, streams keep-alive characters.
- Prompt generates **10 multiple-choice questions** scoped to the event's career cluster (e.g. Marketing, Finance, Business Management + Administration), at a high school DECA difficulty level.
- Questions test general DECA/business-knowledge for that cluster, not the specific PIs of the current scenario.
- Returns:
  ```ts
  type QuizQuestion = {
    question: string;
    choices: [string, string, string, string]; // exactly 4
    correctIndex: 0 | 1 | 2 | 3;
    explanation: string; // one sentence, shown on results page
  };
  type QuizData = { questions: QuizQuestion[] };
  ```
- Validates the returned JSON: exactly 10 questions, each with exactly 4 choices and a valid `correctIndex`. On validation failure, returns `null`.

**Where it's called:** `src/app/api/host/session/route.ts` (POST, where the session is created). After `generateScenario` resolves, call `generateQuiz` with the same event. Both calls share the same stream controller so the host's "creating session…" UI stays alive.

**Storage:** The existing `LiveSession.scenarioJson` column already holds a JSON blob. Extend that blob with a `quizQuestions: QuizQuestion[]` field. No schema migration needed for the session model itself (participant-side additions covered in §3).

**Failure mode:** If `generateQuiz` returns `null`, create the session anyway with `quizQuestions: []`. The host's session page surfaces a small inline warning ("Quiz generation failed — participants will only receive roleplay scoring."). Participants who join such a session skip the quiz entirely (quizScore stays `0`, combined total = roleplay total).

## 3. Data model changes

**File:** `prisma/schema.prisma`, model `LiveParticipant`.

Add two nullable columns:

```prisma
quizAnswersJson String?  // JSON array of { questionIndex, selectedIndex, correct }
quizScore       Int?     // 0–20, set when the 10th answer is submitted
```

Both default to `null` so existing rows are untouched.

Migration name: `add_live_participant_quiz`.

## 4. Participant quiz flow

### 4a. UI changes in `src/app/play/[participantId]/page.tsx`

Today: "End Session" → POST to `/api/live-session/roleplay { action: "end_session" }` → wait on the stream → redirect to results.

New behavior:

1. "End Session" still POSTs to `/api/live-session/roleplay { action: "end_session" }`, which kicks off grading on the server. The fetch runs in the background (fire-and-forget from the UI's perspective; the server persists the result on completion).
2. The UI immediately transitions to a **Quiz screen** instead of a "judge is scoring…" loader.
3. The quiz screen fetches `GET /api/live-session/roleplay?participantId=…` and reads the new `quizQuestions` field (sanitized — see §5). If `quizQuestions` is empty, skip straight to the "waiting for score" loader.
4. Shows one question at a time: question text + 4 big choice buttons + a "Question N of 10" header. No back button, no timer.
5. On selection:
   - Disable buttons.
   - POST to `POST /api/live-session/quiz` with `{ participantId, questionIndex, selectedIndex }`.
   - On success, advance to the next question.
   - On network failure, show a retry button (don't lose the user's selection).
6. After Q10's answer is accepted, show a brief "Waiting for your roleplay score…" loader. Poll `GET /api/live-session/roleplay?participantId=…` every 1.5s until `score` is populated, then redirect to results.

### 4b. Quiz answer persistence endpoint

**New route:** `src/app/api/live-session/quiz/route.ts`, `POST`.

Body: `{ participantId: string, questionIndex: number, selectedIndex: number }`.

Behavior:
- Verifies `readParticipant()` auth matches `participantId`.
- Loads the `LiveParticipant` + `LiveSession`.
- Validates `questionIndex` is 0–9 and `selectedIndex` is 0–3.
- Reads `quizQuestions` from session, determines `correct = selectedIndex === question.correctIndex`.
- Appends to `quizAnswersJson` (idempotent: if the same `questionIndex` is already recorded, reject with 409 to enforce no-re-answering).
- When the 10th unique question is recorded, computes and stores `quizScore = correctCount * 2` (2 pts per correct → max 20).
- Returns `{ ok: true, remaining: number }` (how many unanswered questions remain). Does NOT leak correctness back to the client at this stage.

### 4c. Resume behavior

If a participant closes the tab mid-quiz and rejoins `/play/[participantId]`:
- The page loads `quizAnswersJson`, computes `nextQuestionIndex = length of answered questions`.
- Skips past answered questions and continues from the first unanswered one.
- Already-submitted answers are immutable (server rejects duplicates).

## 5. Server-side data hygiene

**File:** `src/app/api/live-session/roleplay/route.ts`, `GET` handler.

The response already returns `scenario`, PIs, etc. Extend it with:

```ts
quizQuestions: Array<{
  question: string;
  choices: [string, string, string, string];
}>;
answeredCount: number; // how many quiz answers this participant has submitted
```

**Crucial:** while `participant.completed` is `false`, strip `correctIndex` and `explanation` from every question so DevTools inspection doesn't leak answers. When `completed` is `true` (roleplay graded AND all 10 quiz questions answered — see §6 on what "completed" means), include the full objects plus the participant's answer history:

```ts
quizReview: Array<{
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  selectedIndex: number | null;
  correct: boolean;
}>;
```

## 6. Leaderboard & completion semantics

**File:** `src/app/api/live-session/leaderboard/route.ts`.

Current: `orderBy: [{ totalScore: "desc" }, { completedAt: "asc" }]`, filter `completed: true`.

**Simplification to keep eligibility one boolean check:** at participant-join time, if the session has `quizQuestions: []` (no quiz — either failed generation or legacy), immediately write `quizScore: 0` on the new `LiveParticipant` row. This way `quizScore` is `null` if-and-only-if the participant still owes quiz answers.

Leaderboard eligibility is then `completed: true AND quizScore != null`:

```ts
where: {
  sessionId: auth.sessionId,
  completed: true,
  quizScore: { not: null },
}
```

Sort: by `(totalScore ?? 0) + (quizScore ?? 0)` desc, then `completedAt` asc.

Since SQLite can't directly order by a computed sum across two columns via Prisma's high-level API without raw SQL, compute the sum in application code after fetching and sort there. Session leaderboards are small (classroom-sized), so this is fine.

Response shape:
```ts
{
  meId: string;
  participants: Array<{
    rank: number;
    id: string;
    displayName: string;
    totalScore: number;      // combined roleplay + quiz
    isMe: boolean;
  }>;
}
```

The server sends the combined number; the UI continues to display a single number on the leaderboard card. Per-component breakdown lives on the results page header, not the leaderboard.

## 7. Legacy sessions (existing rows at deploy time)

Existing `LiveSession` rows have no `quizQuestions` in their `scenarioJson` blob. Handling:

- On every participant fetch (`GET /api/live-session/roleplay`), if `scenarioData.quizQuestions` is missing (not empty — `undefined`), **lazily generate** the quiz for that session and write it back to `scenarioJson`. One generation per legacy session.
- Use a simple per-session guard: if multiple participants fetch simultaneously during the gap, the second caller sees the updated blob.
- If lazy generation fails, write `quizQuestions: []` so we don't retry forever. That session then behaves as the §2 failure mode (no quiz, combined = roleplay only).

Sessions explicitly marked with `quizQuestions: []` (failed generation or legacy fallback) skip the quiz UI. Per §6, participants joining such a session get `quizScore: 0` written on creation, so they become leaderboard-eligible the moment the roleplay is graded.

**Participants who joined a legacy session *before* this feature shipped** will already exist with `quizScore: null`. A one-time migration (as part of `add_live_participant_quiz`) sets `quizScore = 0` for any `LiveParticipant` whose parent session's `scenarioJson` lacks a `quizQuestions` field, so their leaderboard standing is preserved.

## 8. Host-side updates

### 8a. Host session page (`src/app/host/session/[sessionId]/page.tsx`)

- Participant rows show combined score (roleplay + quiz) so the host sees the same ranking as students.
- Add a small column or sub-line per participant: `roleplayScore / quizScore` split, so the host can still see which area students struggled in.
- If `quizQuestions` is empty on the session (failed generation), show an inline warning at the top of the host page.

### 8b. CSV export (`src/app/api/host/session/[sessionId]/export/route.ts`)

Add columns after the existing `Total Score`:
- `Quiz Score`
- `Combined Total`

Keep existing columns unchanged for backwards compatibility with anyone who already scripts against the export.

## 9. Results page (`src/app/play/[participantId]/results/page.tsx`)

- **Header card:** replace single `totalScore / 100` with a combined `combined / 120` hero number. Two sub-lines: `Roleplay: X / 100` and `Quiz: Y / 20`.
- **Leaderboard card:** unchanged visually — shows the combined number per participant (server-provided).
- **New "Quiz Review" card** below the PI/21st-Century cards:
  - 10 rows, one per question.
  - Each row: question text, the 4 choices with the participant's selection highlighted (green if correct, red if wrong), the correct answer highlighted green, the explanation below, and a `2/2` or `0/2` badge on the right.
  - Sources data from the new `quizReview` field on the roleplay GET response.
- **Existing PI, 21st-Century, Strengths, Improvements cards:** unchanged.

## 10. Out of scope

- Per-question timer (explicitly rejected).
- AI-graded open-ended questions (explicitly rejected).
- Showing correct answers during the quiz (only on results page).
- Changing the base roleplay rubric's 0–100 range, `piScores` structure, or `twentyFirstCenturyScores` structure.
- Backfilling quiz scores for already-completed participants on legacy sessions (they stay at `quizScore = null` and are leaderboard-eligible on roleplay alone).

## 11. Summary of files touched

**Modified:**
- `src/lib/ai/live-roleplay.ts` — recalibrated `gradeRoleplay` prompt; new `generateQuiz` function; new `QuizQuestion`/`QuizData` types.
- `src/app/api/host/session/route.ts` — call `generateQuiz` after `generateScenario`, merge into `scenarioJson`.
- `src/app/api/live-session/roleplay/route.ts` (GET) — return `quizQuestions` (sanitized pre-completion, full `quizReview` post-completion), add lazy quiz generation for legacy sessions.
- `src/app/api/live-session/leaderboard/route.ts` — combined-score ordering, dual completion check.
- `src/app/play/[participantId]/page.tsx` — fire-and-forget grading, transition to quiz UI, poll for score, resume logic.
- `src/app/play/[participantId]/results/page.tsx` — combined score header, new quiz review card.
- `src/app/host/session/[sessionId]/page.tsx` — combined score display, quiz-failure warning.
- `src/app/api/host/session/[sessionId]/export/route.ts` — two new CSV columns.
- `prisma/schema.prisma` — two new columns on `LiveParticipant`.

**New:**
- `src/app/api/live-session/quiz/route.ts` — POST endpoint for persisting individual quiz answers.
- New Prisma migration: `add_live_participant_quiz`.

**Unchanged:**
- `src/components/roleplay/RoleplaySessionUI.tsx` (quiz UI is live-session-specific, built inline in the play page rather than pushed into the shared component).
- Scoring structures for the non-live roleplay path.
