# Mobile Join Fix + Post-Roleplay Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mobile viewport bug so users can join DUZZ Live sessions on phones, and add a 10-question AI-generated multiple-choice quiz after each roleplay whose score is averaged 50/50 with the roleplay score to produce the final leaderboard ranking.

**Architecture:** (1) One-line `viewport` export in the root layout fixes the mobile rendering. (2) After the existing `end_session` roleplay grading call, the same request also asks Claude Haiku to generate 10 MCQs seeded by the event's cluster/description, caches them on `LiveParticipant`, and returns them alongside the grade. The client renders a new quiz phase, POSTs the selected answers to a new `submit_quiz` action, and the server computes the final combined score (`(roleplay + quiz) / 2`), writes it to `totalScore`, and marks the participant completed.

**Tech Stack:** Next.js 16 App Router, Prisma (Turso LibSQL), Anthropic SDK (Haiku 4.5), React 19, TanStack Query, Tailwind v4.

**Testing note:** This repo has no unit-test framework configured (see CLAUDE.md — only `dev`, `build`, `lint`, and Prisma scripts). Each task's verification uses `npm run lint && npm run build` plus manual browser checks. Do not add a test framework as part of this plan.

---

## File Structure

**Created:** none — this plan only modifies existing files.

**Modified:**
- `src/app/layout.tsx` — add `viewport` export (mobile fix).
- `prisma/schema.prisma` — add 4 fields to `LiveParticipant`.
- `src/lib/ai/live-roleplay.ts` — export `generateQuiz()` helper and `QuizQuestion` / `SanitizedQuizQuestion` types.
- `src/app/api/live-session/roleplay/route.ts` — (a) on `end_session` split `roleplayScore` from `totalScore`, don't mark `completed`, generate quiz, cache, include in response; (b) handle new `submit_quiz` action; (c) extend `GET` response to include cached quiz questions.
- `src/components/roleplay/RoleplaySessionUI.tsx` — extend `RoleplaySessionData` & `RoleplayScore` types, add `onSubmitQuiz` prop, add `"quiz"` phase, extend results screen with per-question review + breakdown.
- `src/app/play/[participantId]/page.tsx` — wire `onSubmitQuiz` to POST the new action.

Each file has one clear responsibility. The quiz logic is split: generation/grading lives in `src/lib/ai/live-roleplay.ts`, persistence in the API route, and UI in `RoleplaySessionUI.tsx`.

---

## Task 1: Fix mobile viewport (ships independently)

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read the current layout file**

Open `src/app/layout.tsx`. Confirm it imports `type { Metadata } from "next"` and has no `viewport` export.

- [ ] **Step 2: Add the viewport import and export**

Edit `src/app/layout.tsx`. Change line 1 from:

```ts
import type { Metadata } from "next";
```

to:

```ts
import type { Metadata, Viewport } from "next";
```

Then add immediately after the `metadata` export (after the closing `};` of `export const metadata`, around line 28):

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};
```

Do not set `userScalable: false` — accessibility.

- [ ] **Step 3: Verify build + lint pass**

Run:

```bash
npm run lint && npm run build
```

Expected: lint passes, Next.js build completes with no errors. The build output should not warn about viewport metadata.

- [ ] **Step 4: Manual mobile verification**

Run `npm run dev`, open `http://localhost:3000/play` in Chrome DevTools mobile emulation (iPhone 14 Pro or Pixel 7).

Expected: the "Join a DUZZ Game" form fills the device width. Email input, name input, PIN input, and "Continue" / "Join Game" buttons are full-width and easily tappable. No zoomed-out appearance, no horizontal scroll.

If you see the form as a tiny sliver centered in a zoomed-out desktop-width page, the viewport export did not take effect — check that it is a named export from `layout.tsx` and not nested inside another object.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "Fix mobile viewport so join form is usable on phones"
```

---

## Task 2: Add quiz fields to LiveParticipant

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update the LiveParticipant model**

In `prisma/schema.prisma`, find the `LiveParticipant` model (around line 384). Replace its fields block with:

```prisma
model LiveParticipant {
  id                String    @id @default(cuid())
  sessionId         String
  email             String
  displayName       String
  messagesJson      String?
  scoreJson         String?
  roleplayScore     Float?
  quizQuestionsJson String?
  quizAnswersJson   String?
  quizScore         Float?
  totalScore        Float?
  completed         Boolean   @default(false)
  createdAt         DateTime  @default(now())
  completedAt       DateTime?

  session LiveSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@unique([sessionId, email])
  @@index([sessionId])
  @@index([email])
}
```

Semantics:
- `roleplayScore` (0–100): the raw score Claude returned for the roleplay. Was previously mirrored into `totalScore`.
- `quizQuestionsJson`: JSON array of `{prompt: string, options: [string, string, string, string], correctIndex: number}` — cached on first `end_session` call so a refresh doesn't re-roll them.
- `quizAnswersJson`: JSON array of 10 integers (0–3) — the user's selected indices, stored at submit time.
- `quizScore` (0–100): `(correctCount / 10) * 100`.
- `totalScore`: NOW means the combined final score `(roleplayScore + quizScore) / 2`. Set only at quiz submit. Leaderboard sorts by this field, so participants who haven't finished the quiz correctly don't appear on the leaderboard yet.

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add-quiz-fields
```

Expected: Prisma prompts for confirmation (or runs silently if non-interactive), creates a new migration SQL file under `prisma/migrations/<timestamp>_add-quiz-fields/migration.sql` with four `ALTER TABLE LiveParticipant ADD COLUMN ...` statements, regenerates the client to `src/generated/prisma/`. No data loss on existing rows because all added columns are nullable.

- [ ] **Step 3: Verify build passes with new types**

```bash
npm run lint && npm run build
```

Expected: passes. The generated Prisma client now types `LiveParticipant` with the four new fields.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "Add quiz score fields to LiveParticipant"
```

---

## Task 3: Add quiz generation + grading helpers

**Files:**
- Modify: `src/lib/ai/live-roleplay.ts`

- [ ] **Step 1: Add type exports at the top of the file**

In `src/lib/ai/live-roleplay.ts`, after the `RoleplayGrade` type (around line 77), add:

```ts
export type QuizQuestion = {
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export type SanitizedQuizQuestion = {
  prompt: string;
  options: [string, string, string, string];
};

export function sanitizeQuiz(questions: QuizQuestion[]): SanitizedQuizQuestion[] {
  return questions.map((q) => ({ prompt: q.prompt, options: q.options }));
}
```

`sanitizeQuiz` is used when returning questions to the client so `correctIndex` never leaves the server.

- [ ] **Step 2: Add `generateQuiz` function**

Append to the bottom of `src/lib/ai/live-roleplay.ts`:

```ts
/**
 * Generate 10 multiple-choice knowledge questions for a DECA event's cluster.
 * Used after a roleplay to test content knowledge. Returns null on parse failure.
 *
 * Not streamed — this runs serially after gradeRoleplay so the keep-alive from
 * the grade call covers it; adds roughly 2-4s to the overall request.
 */
export async function generateQuiz(event: {
  code: string;
  name: string;
  cluster: string;
  description: string;
}): Promise<QuizQuestion[] | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2500,
    system: `You are a DECA cluster exam writer for the ${event.cluster.replace(/_/g, " ")} career cluster.

Event context: ${event.name} (${event.code}). ${event.description.substring(0, 400)}

Generate exactly 10 multiple-choice questions that mimic the difficulty and style of real DECA cluster exam questions. Cover a mix of:
- Core concepts from the ${event.cluster.replace(/_/g, " ")} cluster
- Applied business knowledge relevant to ${event.name}
- Terminology, calculations, and scenario-based reasoning

Rules:
- Each question has exactly 4 options, one clearly correct.
- Distractors must be plausible — not obvious wrong answers.
- Vary difficulty: 3 easy, 5 medium, 2 hard.
- Do not reference DECA, the student, or "the exam" in question text.

Return ONLY a JSON object (no markdown, no code blocks, no prose) in this exact shape:

{"questions":[{"prompt":"...","options":["A","B","C","D"],"correctIndex":0}]}

correctIndex is 0, 1, 2, or 3 (zero-based).`,
    messages: [
      {
        role: "user",
        content: `Generate 10 multiple-choice questions for the ${event.cluster.replace(/_/g, " ")} cluster, calibrated to the ${event.name} event.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const parsed = tryParseJson<{ questions?: QuizQuestion[] }>(textBlock.text);
  if (!parsed?.questions || !Array.isArray(parsed.questions)) return null;

  const valid = parsed.questions.filter(
    (q): q is QuizQuestion =>
      typeof q?.prompt === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((o) => typeof o === "string") &&
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3
  );

  if (valid.length < 10) return null;
  return valid.slice(0, 10);
}

/**
 * Grade a set of quiz answers against the cached questions.
 * Returns { quizScore (0-100), correctAnswers (server-side correct indices) }.
 */
export function gradeQuiz(
  questions: QuizQuestion[],
  userAnswers: number[]
): { quizScore: number; correctAnswers: number[] } {
  const correctAnswers = questions.map((q) => q.correctIndex);
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (userAnswers[i] === questions[i].correctIndex) correct += 1;
  }
  const quizScore = questions.length === 0 ? 0 : (correct / questions.length) * 100;
  return { quizScore, correctAnswers };
}
```

- [ ] **Step 3: Verify build + lint**

```bash
npm run lint && npm run build
```

Expected: passes. Both new exports are referenced only in Task 4 and beyond, so no other callers break.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/live-roleplay.ts
git commit -m "Add Haiku-backed quiz generator and grader for live sessions"
```

---

## Task 4: Update `end_session` to generate + cache quiz

**Files:**
- Modify: `src/app/api/live-session/roleplay/route.ts`

- [ ] **Step 1: Update imports**

Replace the imports at the top of `src/app/api/live-session/roleplay/route.ts` with:

```ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readParticipant } from "@/lib/live-session";
import {
  gradeRoleplay,
  generateQuiz,
  gradeQuiz,
  sanitizeQuiz,
  type QuizQuestion,
} from "@/lib/ai/live-roleplay";
```

- [ ] **Step 2: Rewrite the `end_session` branch**

Replace the entire `if (action === "end_session") { ... }` block (lines 78–150 in the current file) with:

```ts
  if (action === "end_session") {
    if (participant.completed) {
      return new Response(JSON.stringify({ error: "Already submitted." }), { status: 409 });
    }
    if (participant.session.status !== "open") {
      return new Response(
        JSON.stringify({ error: "This session has been closed by the host." }),
        { status: 409 }
      );
    }

    const scenarioData = JSON.parse(participant.session.scenarioJson);

    const event = await prisma.decaEvent.findUnique({
      where: { code: participant.session.eventCode },
      select: { code: true, name: true, cluster: true, description: true },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const grade = await gradeRoleplay(
            {
              eventCode: participant.session.eventCode,
              eventName: scenarioData.eventName || participant.session.eventCode,
              eventCategory: scenarioData.eventCategory || "PRINCIPLES_EVENTS",
              scenario: scenarioData.scenario,
              performanceIndicators: scenarioData.performanceIndicators || [],
              fullTranscript: fullTranscript ?? "",
            },
            { controller, encoder }
          );

          if (!grade) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ error: "Failed to parse evaluation. Please try again." })
              )
            );
            controller.close();
            return;
          }

          // Reuse a cached quiz if the participant already has one (refresh after
          // first end_session call). Otherwise, generate a fresh batch.
          let quiz: QuizQuestion[] | null = null;
          if (participant.quizQuestionsJson) {
            try {
              quiz = JSON.parse(participant.quizQuestionsJson) as QuizQuestion[];
            } catch {
              quiz = null;
            }
          }
          if (!quiz && event) {
            quiz = await generateQuiz(event);
          }
          if (!quiz) {
            // Fall back to a no-op: if quiz generation fails, mark quiz complete
            // with a 0-question quiz so the participant can still finish. Treat
            // the roleplay as the full score to avoid stranding users.
            await prisma.liveParticipant.update({
              where: { id: participant.id },
              data: {
                messagesJson: JSON.stringify(
                  fullTranscript
                    ? [{ role: "user", content: fullTranscript, timestamp: new Date().toISOString() }]
                    : []
                ),
                scoreJson: JSON.stringify(grade),
                roleplayScore: typeof grade.totalScore === "number" ? grade.totalScore : 0,
                quizQuestionsJson: JSON.stringify([]),
                quizAnswersJson: JSON.stringify([]),
                quizScore: 0,
                totalScore: typeof grade.totalScore === "number" ? grade.totalScore : 0,
                completed: true,
                completedAt: new Date(),
              },
            });
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ ...grade, quizQuestions: [] })
              )
            );
            controller.close();
            return;
          }

          await prisma.liveParticipant.update({
            where: { id: participant.id },
            data: {
              messagesJson: JSON.stringify(
                fullTranscript
                  ? [{ role: "user", content: fullTranscript, timestamp: new Date().toISOString() }]
                  : []
              ),
              scoreJson: JSON.stringify(grade),
              roleplayScore: typeof grade.totalScore === "number" ? grade.totalScore : 0,
              quizQuestionsJson: JSON.stringify(quiz),
              // Intentionally NOT setting: totalScore, completed, completedAt.
              // Those are set when the quiz is submitted via submit_quiz.
            },
          });

          controller.enqueue(
            encoder.encode(
              JSON.stringify({ ...grade, quizQuestions: sanitizeQuiz(quiz) })
            )
          );
          controller.close();
        } catch (err) {
          const message = (err as Error).message || "unknown error";
          console.error("Live roleplay score error:", message, err);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: `Scoring failed: ${message}` })
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
    });
  }
```

Key changes from the existing code:
1. Loads `DecaEvent` by `eventCode` to get cluster + description.
2. After grading, reuses cached quiz if present (for refresh safety), otherwise generates a new one.
3. Writes `roleplayScore` (not `totalScore`) and `quizQuestionsJson`, but does NOT set `completed` or `totalScore`.
4. Returns `{ ...grade, quizQuestions: SanitizedQuizQuestion[] }` — sanitized (no `correctIndex`).
5. Has a graceful fallback when `generateQuiz` returns null: marks complete with quiz 0-weighted so users aren't stranded.

- [ ] **Step 3: Verify build + lint**

```bash
npm run lint && npm run build
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/live-session/roleplay/route.ts
git commit -m "Generate and cache MC quiz alongside roleplay grading"
```

---

## Task 5: Add `submit_quiz` action and expose quiz on GET

**Files:**
- Modify: `src/app/api/live-session/roleplay/route.ts`

- [ ] **Step 1: Update the GET handler to return cached quiz questions**

In `src/app/api/live-session/roleplay/route.ts`, replace the JSON body returned by the `GET` handler (currently lines 32–47 after Task 4 edits). Find the `return new Response(JSON.stringify({ ... }))` block inside `GET` and replace with:

```ts
  let quizQuestions: ReturnType<typeof sanitizeQuiz> | null = null;
  if (participant.quizQuestionsJson) {
    try {
      const raw = JSON.parse(participant.quizQuestionsJson);
      if (Array.isArray(raw) && raw.length > 0) {
        quizQuestions = sanitizeQuiz(raw);
      }
    } catch {
      quizQuestions = null;
    }
  }

  return new Response(
    JSON.stringify({
      id: participant.id,
      eventCode: participant.session.eventCode,
      eventName: scenarioData.eventName || participant.session.eventCode,
      eventCategory: scenarioData.eventCategory || "PRINCIPLES_EVENTS",
      scenario: scenarioData.scenario,
      performanceIndicators: scenarioData.performanceIndicators || [],
      twentyFirstCenturySkills: scenarioData.twentyFirstCenturySkills || [],
      judgeFollowUpQuestions: (scenarioData.judgeFollowUpQuestions || []).slice(0, 2),
      messages,
      completed: participant.completed,
      score,
      quizQuestions,
      quizSubmitted: !!participant.quizAnswersJson,
      sessionStatus: participant.session.status,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
```

`quizSubmitted` lets the client distinguish "roleplay graded, quiz pending" from "all done."

- [ ] **Step 2: Add the `submit_quiz` action handler**

In the same file, the POST handler currently ends with:

```ts
  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
}
```

Change the body extraction near the top of POST so `answers` is accepted. Replace:

```ts
  let body: { action?: string; fullTranscript?: string; participantId?: string };
```

with:

```ts
  let body: {
    action?: string;
    fullTranscript?: string;
    participantId?: string;
    answers?: unknown;
  };
```

And replace the destructure line:

```ts
  const { action, fullTranscript, participantId } = body;
```

with:

```ts
  const { action, fullTranscript, participantId, answers } = body;
```

Then, immediately before the final `return new Response(JSON.stringify({ error: "Invalid action" }), ...)` line, insert:

```ts
  if (action === "submit_quiz") {
    if (participant.completed) {
      return new Response(JSON.stringify({ error: "Already submitted." }), { status: 409 });
    }
    if (!participant.quizQuestionsJson || participant.roleplayScore == null) {
      return new Response(
        JSON.stringify({ error: "Quiz not ready. Finish the roleplay first." }),
        { status: 409 }
      );
    }
    if (
      !Array.isArray(answers) ||
      answers.length !== 10 ||
      !answers.every((a) => typeof a === "number" && a >= 0 && a <= 3)
    ) {
      return new Response(
        JSON.stringify({ error: "Submit exactly 10 answers, each 0-3." }),
        { status: 400 }
      );
    }

    let questions: QuizQuestion[];
    try {
      questions = JSON.parse(participant.quizQuestionsJson) as QuizQuestion[];
    } catch {
      return new Response(
        JSON.stringify({ error: "Quiz data corrupted. Please refresh." }),
        { status: 500 }
      );
    }
    if (questions.length !== 10) {
      return new Response(
        JSON.stringify({ error: "Quiz data corrupted. Please refresh." }),
        { status: 500 }
      );
    }

    const roleplayScore = participant.roleplayScore ?? 0;
    const { quizScore, correctAnswers } = gradeQuiz(questions, answers as number[]);
    const totalScore = Math.round(((roleplayScore + quizScore) / 2) * 10) / 10;

    await prisma.liveParticipant.update({
      where: { id: participant.id },
      data: {
        quizAnswersJson: JSON.stringify(answers),
        quizScore,
        totalScore,
        completed: true,
        completedAt: new Date(),
      },
    });

    return new Response(
      JSON.stringify({
        roleplayScore,
        quizScore,
        totalScore,
        correctAnswers,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
```

Note on the guard `participant.roleplayScore == null`: using `==` (not `===`) so `null` and `undefined` both match, but a legitimate score of `0` does NOT trigger the guard — so a user who gave a truly empty roleplay response isn't locked out of submitting their quiz.

- [ ] **Step 3: Verify build + lint**

```bash
npm run lint && npm run build
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/live-session/roleplay/route.ts
git commit -m "Accept submit_quiz action and expose cached quiz on GET"
```

---

## Task 6: Extend UI types and add quiz phase state

**Files:**
- Modify: `src/components/roleplay/RoleplaySessionUI.tsx`

- [ ] **Step 1: Extend type definitions**

In `src/components/roleplay/RoleplaySessionUI.tsx`, replace the `RoleplaySessionData` and `RoleplayScore` interfaces (lines 31–62 currently) with:

```ts
export interface QuizQuestionView {
  prompt: string;
  options: [string, string, string, string];
}

export interface RoleplaySessionData {
  id: string;
  eventCode: string;
  eventName: string;
  eventCategory: string;
  scenario: string;
  performanceIndicators: string[];
  twentyFirstCenturySkills: string[];
  judgeFollowUpQuestions: string[];
  messages: RoleplayMessage[];
  completed: boolean;
  score: RoleplayScore | null;
  quizQuestions?: QuizQuestionView[] | null;
  quizSubmitted?: boolean;
}

export interface RoleplayScore {
  totalScore: number;
  overallFeedback?: string;
  piScores?: Array<{
    indicator: string;
    score: number;
    maxPoints: number;
    feedback: string;
    level?: string;
  }>;
  twentyFirstCenturyScores?: Array<{
    skill: string;
    score: number;
    maxPoints: number;
  }>;
  strengths?: string[];
  improvements?: string[];
  quizQuestions?: QuizQuestionView[];
}

export interface QuizResult {
  roleplayScore: number;
  quizScore: number;
  totalScore: number;
  correctAnswers: number[];
}
```

Semantic note: `RoleplayScore.totalScore` still equals the **roleplay** score for this type (that's what Claude returns from `gradeRoleplay`). The *combined* score lives in `QuizResult.totalScore`.

- [ ] **Step 2: Update the `Props` interface and `Phase` union**

Replace the `Props` interface (lines 64–72) with:

```ts
interface Props {
  sessionData: RoleplaySessionData | undefined;
  isLoading: boolean;
  onEndSession: (fullTranscript: string) => Promise<RoleplayScore>;
  onSubmitQuiz?: (answers: number[]) => Promise<QuizResult>;
  backHref: string;
  newHref: string;
  newLabel?: string;
  headerSubtitle?: string;
}
```

Replace the `Phase` type:

```ts
type Phase = "prep" | "presenting" | "followup" | "quiz" | "results";
```

- [ ] **Step 3: Add quiz-related component state**

Inside the `RoleplaySessionUI` component, next to the existing `useState` declarations (around line 115), add:

```ts
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionView[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
```

- [ ] **Step 4: Wire the `onSubmitQuiz` mutation**

After the existing `endSession` `useMutation` declaration (around line 279), add:

```ts
  const submitQuiz = useMutation({
    mutationFn: async (answers: number[]) => {
      if (!onSubmitQuiz) {
        throw new Error("Quiz submission is not available for this session.");
      }
      return onSubmitQuiz(answers);
    },
    onSuccess: (result) => {
      setQuizResult(result);
      setPhase("results");
    },
  });
```

- [ ] **Step 5: Transition from roleplay end → quiz phase**

Modify `handleFinishRoleplay` (around line 341). Replace its body with:

```ts
  const handleFinishRoleplay = () => {
    stopListening();
    const pendingText = transcript.trim();

    const allMsgs = [...messages];
    if (pendingText) {
      allMsgs.push({ role: "user", content: pendingText, timestamp: new Date().toISOString() });
    }

    if (allMsgs.length === 0) return;

    setMessages(allMsgs);
    setTranscript("");
    setInterimTranscript("");

    const fullTranscript = allMsgs.map((m) => `${m.role}: ${m.content}`).join("\n\n");
    endSession.mutate(fullTranscript, {
      onSuccess: (score) => {
        if (onSubmitQuiz && score.quizQuestions && score.quizQuestions.length > 0) {
          setQuizQuestions(score.quizQuestions);
          setQuizAnswers(new Array(score.quizQuestions.length).fill(null));
          setPhase("quiz");
        } else {
          setPhase("results");
        }
      },
    });
  };
```

Also remove the existing `onSuccess: () => setPhase("results")` from the `endSession` mutation declaration (around line 281) — the new per-call `onSuccess` handles the phase transition.

The updated mutation should read:

```ts
  const endSession = useMutation({
    mutationFn: (fullTranscript: string) => onEndSession(fullTranscript),
  });
```

- [ ] **Step 6: Handle refresh-during-quiz**

After the existing `useEffect` hooks (around line 155), add:

```ts
  // If the server has a cached quiz (user refreshed mid-quiz), hydrate state.
  useEffect(() => {
    if (
      sessionData?.quizQuestions &&
      sessionData.quizQuestions.length > 0 &&
      !sessionData.quizSubmitted &&
      phase !== "quiz" &&
      phase !== "results"
    ) {
      setQuizQuestions(sessionData.quizQuestions);
      setQuizAnswers(new Array(sessionData.quizQuestions.length).fill(null));
      setPhase("quiz");
    }
  }, [sessionData?.quizQuestions, sessionData?.quizSubmitted, phase]);
```

- [ ] **Step 7: Verify build + lint**

```bash
npm run lint && npm run build
```

Expected: passes. You will see no visual change yet — the quiz phase renders nothing until Task 7.

- [ ] **Step 8: Commit**

```bash
git add src/components/roleplay/RoleplaySessionUI.tsx
git commit -m "Add quiz phase state and types to roleplay session UI"
```

---

## Task 7: Render the quiz phase

**Files:**
- Modify: `src/components/roleplay/RoleplaySessionUI.tsx`

- [ ] **Step 1: Add the quiz phase JSX**

In `src/components/roleplay/RoleplaySessionUI.tsx`, find the `{/* RESULTS */}` comment (currently after the `{(phase === "presenting" || phase === "followup") && ...}` block). Immediately **before** that `{/* RESULTS */}` block, insert the following JSX:

```tsx
      {/* QUIZ */}
      {phase === "quiz" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Knowledge Check
              </CardTitle>
              <CardDescription>
                Answer all 10 questions. Your quiz score averages with your roleplay
                score to determine your final ranking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {quizAnswers.filter((a) => a !== null).length} of {quizQuestions.length} answered
                </span>
                <Progress
                  value={
                    quizQuestions.length === 0
                      ? 0
                      : (quizAnswers.filter((a) => a !== null).length / quizQuestions.length) * 100
                  }
                  className="h-2 flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {quizQuestions.map((q, qi) => (
            <Card key={qi}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  <span className="text-muted-foreground mr-2">{qi + 1}.</span>
                  {q.prompt}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, oi) => {
                    const selected = quizAnswers[qi] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() =>
                          setQuizAnswers((prev) => {
                            const next = [...prev];
                            next[qi] = oi;
                            return next;
                          })
                        }
                        className={`text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          selected
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-muted/30 text-foreground/80 hover:bg-muted/60"
                        }`}
                      >
                        <span className="inline-block w-5 font-mono text-xs text-muted-foreground">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {submitQuiz.isError && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {submitQuiz.error instanceof Error
                  ? submitQuiz.error.message
                  : "Failed to submit quiz. Please try again."}
              </span>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={
              submitQuiz.isPending ||
              quizAnswers.some((a) => a === null) ||
              quizQuestions.length === 0
            }
            onClick={() => submitQuiz.mutate(quizAnswers.filter((a): a is number => a !== null))}
          >
            {submitQuiz.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit Quiz &amp; Get Final Score</>
            )}
          </Button>
        </div>
      )}
```

- [ ] **Step 2: Verify build + lint**

```bash
npm run lint && npm run build
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/roleplay/RoleplaySessionUI.tsx
git commit -m "Render quiz phase with question cards and progress"
```

---

## Task 8: Update results screen to show combined score + quiz review

**Files:**
- Modify: `src/components/roleplay/RoleplaySessionUI.tsx`

- [ ] **Step 1: Replace the results-screen hero card**

In `src/components/roleplay/RoleplaySessionUI.tsx`, find the `{/* RESULTS */}` block — it starts with `{phase === "results" && score && (` and contains a hero `<Card>` showing `{score.totalScore}` / 100 at the top.

Change the conditional from `phase === "results" && score` to `phase === "results" && (score || quizResult)`.

Replace the single top `<Card>` (the hero card with the big 5xl number) with the following combined-breakdown block:

```tsx
          {quizResult ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-5xl font-bold">
                  {quizResult.totalScore}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </CardTitle>
                <CardDescription>Final Combined Score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={quizResult.totalScore} className="h-3" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Roleplay</p>
                    <p className="text-2xl font-semibold mt-0.5">
                      {quizResult.roleplayScore}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Quiz</p>
                    <p className="text-2xl font-semibold mt-0.5">
                      {quizResult.quizScore}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Final score is the average of your roleplay and quiz scores.
                </p>
              </CardContent>
            </Card>
          ) : score ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-5xl font-bold">
                  {score.totalScore}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </CardTitle>
                <CardDescription>Roleplay Performance Score</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={score.totalScore} className="h-3" />
              </CardContent>
            </Card>
          ) : null}
```

The `score ? ...` fallback keeps the old UX when there is no quiz (e.g., `onSubmitQuiz` prop isn't wired).

- [ ] **Step 2: Add per-question quiz review**

Inside the same `phase === "results"` block, after the existing "Areas to Improve" grid (right before the final `<div className="flex gap-3">` with Back/New buttons), insert:

```tsx
          {quizResult && quizQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Quiz Review
                </CardTitle>
                <CardDescription>
                  You got {quizResult.correctAnswers.filter((c, i) => quizAnswers[i] === c).length} of{" "}
                  {quizQuestions.length} correct.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quizQuestions.map((q, qi) => {
                  const correct = quizResult.correctAnswers[qi];
                  const chosen = quizAnswers[qi];
                  const isRight = chosen === correct;
                  return (
                    <div key={qi} className="space-y-2">
                      <div className="flex items-start gap-2">
                        {isRight ? (
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                        )}
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground mr-1">{qi + 1}.</span>
                          {q.prompt}
                        </p>
                      </div>
                      <div className="space-y-1 ml-6">
                        {q.options.map((opt, oi) => {
                          const isCorrect = oi === correct;
                          const isChosen = oi === chosen;
                          const cls = isCorrect
                            ? "border-green-500/60 bg-green-500/10"
                            : isChosen
                            ? "border-red-500/60 bg-red-500/10"
                            : "border-border bg-muted/20";
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs ${cls}`}
                            >
                              <span className="font-mono text-muted-foreground w-4">
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                                  Correct
                                </span>
                              )}
                              {isChosen && !isCorrect && (
                                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                                  Your answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
```

- [ ] **Step 3: Verify build + lint**

```bash
npm run lint && npm run build
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/roleplay/RoleplaySessionUI.tsx
git commit -m "Show combined score breakdown and quiz review on results screen"
```

---

## Task 9: Wire `onSubmitQuiz` in the play page

**Files:**
- Modify: `src/app/play/[participantId]/page.tsx`

- [ ] **Step 1: Update the type import**

Replace the existing import from `@/components/roleplay/RoleplaySessionUI` at the top of `src/app/play/[participantId]/page.tsx`:

```tsx
import {
  RoleplaySessionUI,
  type RoleplaySessionData,
  type RoleplayScore,
  type QuizResult,
} from "@/components/roleplay/RoleplaySessionUI";
```

- [ ] **Step 2: Add the `onSubmitQuiz` handler**

After the existing `onEndSession` definition (around line 45–63), add:

```tsx
  const onSubmitQuiz = async (answers: number[]): Promise<QuizResult> => {
    const res = await fetch("/api/live-session/roleplay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit_quiz",
        participantId,
        answers,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to submit quiz.");
    }
    return data as QuizResult;
  };
```

- [ ] **Step 3: Pass the prop to `RoleplaySessionUI`**

Find the `<RoleplaySessionUI ... />` element at the bottom of the file (around line 105). Add the `onSubmitQuiz` prop:

```tsx
      <RoleplaySessionUI
        sessionData={data}
        isLoading={isLoading}
        onEndSession={onEndSession}
        onSubmitQuiz={onSubmitQuiz}
        backHref="/"
        newHref={`/play/${participantId}/results`}
        newLabel="View Leaderboard"
        headerSubtitle="Live Session"
      />
```

- [ ] **Step 4: Verify build + lint**

```bash
npm run lint && npm run build
```

Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/app/play/[participantId]/page.tsx
git commit -m "Wire submit_quiz POST in live play page"
```

---

## Task 10: End-to-end manual verification

**Files:** none (manual test pass only).

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Host creates a live session**

Visit `http://localhost:3000/host` in Chrome. Use the host password (see `src/lib/live-session.ts:6` — `"password123"`). Create a session for any event code — recommend a Principles event like `PBM` or `PFN` since those are the most common. Note the 6-digit code shown.

- [ ] **Step 3: Join on mobile emulation**

Open a second browser (or incognito). Open DevTools → Device Emulation → iPhone 14 Pro. Visit `http://localhost:3000/play`. Fill the 3-step wizard with any email, display name, and the code from step 2.

Expected: the form fills the viewport, inputs are tappable, submission succeeds, and you land on `/play/<participantId>` with the prep screen.

- [ ] **Step 4: Complete the roleplay**

Click "I'm Ready — Start Presentation." Type any ~1–2 paragraph response in the transcript box (speech recognition won't work on iOS Safari emulation — typing is the fallback). Click "Submit Presentation." Answer one or two follow-ups, then click "End & Get Score."

Expected: after ~10–20 seconds of grading, the UI transitions to the **quiz phase** showing 10 questions (not the results screen). The progress bar reads `0 of 10 answered`.

- [ ] **Step 5: Complete the quiz**

Answer all 10 questions. Note that "Submit Quiz & Get Final Score" is disabled until every question has a selection.

Expected: after submit, the UI transitions to the results screen. The hero card shows "Final Combined Score" with a big number, plus two tiles showing "Roleplay" and "Quiz" sub-scores. Below: standard PI breakdown, strengths/improvements, then the **Quiz Review** card showing each question with green (correct) / red (wrong) highlights.

- [ ] **Step 6: Verify refresh-during-quiz behavior**

Before submitting the quiz, refresh the browser tab. Expected: the quiz re-appears with the same 10 questions (but your previous in-flight answers are gone — that's intentional, we only cache questions, not selections). The roleplay grading does not run again.

- [ ] **Step 7: Verify leaderboard**

After submitting the quiz, navigate to `/play/<participantId>/results` (or click the "View Leaderboard" button). Expected: your entry appears with the **combined** score. To confirm the leaderboard sorts on the combined score, spin up a second incognito browser and join the same session. End the roleplay but do NOT submit the quiz — that participant should NOT appear on the leaderboard yet (because `totalScore` is still null).

- [ ] **Step 8: Visual viewport sanity check (desktop)**

Disable mobile emulation. Reload `/play`. Expected: the form still renders at `max-w-sm` centered on the page; no regression from the viewport change.

- [ ] **Step 9: Commit verification notes if any adjustments were needed**

If any visual tweaks came out of the manual test (spacing, copy, etc.), commit them with a descriptive message. Otherwise, no commit needed.

---

## Self-Review Notes

Coverage check against spec:
- **Viewport fix** → Task 1.
- **Schema fields** (`quizQuestionsJson`, `quizAnswersJson`, `quizScore`, `roleplayScore`, `totalScore` semantics) → Task 2.
- **AI quiz generation per participant, cluster-seeded** → Task 3 (`generateQuiz`) + Task 4 (call site with event lookup).
- **Cache on first `end_session`, reuse on refresh** → Task 4 (reads `participant.quizQuestionsJson` first) + Task 5 (GET returns cached quiz) + Task 6 step 6 (client hydrates from GET).
- **Sanitize `correctIndex`** → Task 3 (`sanitizeQuiz`) + Task 4 + Task 5.
- **Submit action with validation** → Task 5.
- **Simple average scoring** → Task 5 (`(roleplayScore + quizScore) / 2`, rounded to 1 decimal).
- **Leaderboard shows only fully-completed participants** → Task 2 (set `totalScore` only at submit) + no code changes needed to leaderboard route.
- **No timer per question** → Task 7 (no timer rendered).
- **Results screen shows both scores + per-question review** → Task 8.
- **Wire onSubmitQuiz from play page** → Task 9.
- **Manual test pass** → Task 10.
- **Out of scope honored**: authenticated `/roleplay` flow untouched; no retake logic; AI-generated only.
