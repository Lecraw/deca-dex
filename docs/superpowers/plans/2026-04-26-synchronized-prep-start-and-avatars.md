# Synchronized Prep Start + Basic Avatars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a host-controlled "Start Prep for Everyone" button that synchronizes the 10-min prep timer across all live-session participants, and render a deterministic auto-generated avatar (initial on a colored gradient) for each participant in the lobby, host participant table, and host leaderboard.

**Architecture:** Add a nullable `prepStartedAt` timestamp on `LiveSession`. The host POSTs to set it; both host and participant clients GET it. The participant UI gains a `lobby` phase shown while `prepStartedAt` is null; once it's set, the existing `prep` phase computes its remaining time as `600 - (Date.now() - prepStartedAt)`. Avatars are pure client-side derivation from `participant.id` — no schema, no storage. Quiz flow is unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma + Turso LibSQL, TanStack React Query, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-04-26-synchronized-prep-start-design.md`

**Note on testing:** This repo has no automated test framework (no Jest/Vitest/Playwright). Validation is `npm run lint`, `npx tsc --noEmit`, and manual browser testing via `npm run dev`. Each task ends with a typecheck + lint + targeted manual check + commit.

---

## Task 1: Add `prepStartedAt` to `LiveSession` schema and migration

**Files:**
- Modify: `prisma/schema.prisma` (the `LiveSession` model, around line 369)
- Create: `prisma/migrations/20260426120000_add_prep_started_at/migration.sql`

- [ ] **Step 1: Add the field to the Prisma schema**

Open `prisma/schema.prisma` and edit the `LiveSession` model. After the `closedAt DateTime?` line, add:

```prisma
model LiveSession {
  id            String    @id @default(cuid())
  code          String    @unique
  eventCode     String
  scenarioJson  String
  status        String    @default("open")
  createdAt     DateTime  @default(now())
  closedAt      DateTime?
  prepStartedAt DateTime?

  participants LiveParticipant[]

  @@index([code])
  @@index([status])
}
```

- [ ] **Step 2: Create the migration SQL file**

Create directory and file `prisma/migrations/20260426120000_add_prep_started_at/migration.sql` with:

```sql
-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN "prepStartedAt" DATETIME;
```

- [ ] **Step 3: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client" success message. The generated client at `src/generated/prisma/` is updated.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors. (The new field is optional, so existing reads/writes remain valid.)

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260426120000_add_prep_started_at src/generated/prisma
git commit -m "Add prepStartedAt column to LiveSession"
```

---

## Task 2: Create the `Avatar` component

**Files:**
- Create: `src/components/live/Avatar.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/live/Avatar.tsx` with the full content:

```tsx
const PALETTE = [
  "from-rose-400 to-pink-600",
  "from-orange-400 to-red-500",
  "from-amber-400 to-orange-600",
  "from-lime-400 to-green-600",
  "from-emerald-400 to-teal-600",
  "from-cyan-400 to-blue-600",
  "from-sky-400 to-indigo-600",
  "from-violet-400 to-purple-600",
  "from-fuchsia-400 to-pink-600",
  "from-slate-400 to-slate-700",
] as const;

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getAvatar(seed: string, displayName: string): {
  initial: string;
  gradient: string;
} {
  const trimmed = displayName.trim();
  const initial = trimmed.length > 0 ? trimmed[0].toUpperCase() : "?";
  const gradient = PALETTE[hash(seed || displayName) % PALETTE.length];
  return { initial, gradient };
}

interface AvatarProps {
  seed: string;
  displayName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-2xl",
} as const;

export function Avatar({ seed, displayName, size = "md", className }: AvatarProps) {
  const { initial, gradient } = getAvatar(seed, displayName);
  return (
    <div
      className={`shrink-0 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-semibold text-white ${SIZE_CLASSES[size]} ${className ?? ""}`}
      aria-label={`${displayName} avatar`}
    >
      {initial}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: No errors related to the new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/live/Avatar.tsx
git commit -m "Add deterministic Avatar component for live sessions"
```

---

## Task 3: Host API — accept `start_prep` POST and expose `prepStartedAt` on GET

**Files:**
- Modify: `src/app/api/host/session/[sessionId]/route.ts`

- [ ] **Step 1: Add `prepStartedAt` to the GET response**

In `src/app/api/host/session/[sessionId]/route.ts`, locate the `NextResponse.json({ ... })` block at the end of `GET` (around line 38). Add `prepStartedAt: session.prepStartedAt,` immediately after the `closedAt: session.closedAt,` line:

```ts
  return NextResponse.json({
    id: session.id,
    code: session.code,
    eventCode: session.eventCode,
    status: session.status,
    createdAt: session.createdAt,
    closedAt: session.closedAt,
    prepStartedAt: session.prepStartedAt,
    eventName: scenario.eventName ?? session.eventCode,
    scenario: scenario.scenario ?? "",
    performanceIndicators: scenario.performanceIndicators ?? [],
    participants: session.participants.map((p) => ({
      id: p.id,
      email: p.email,
      displayName: p.displayName,
      completed: p.completed,
      totalScore: p.totalScore,
      createdAt: p.createdAt,
      completedAt: p.completedAt,
    })),
  });
```

- [ ] **Step 2: Add the `POST` handler**

In the same file, add a new `POST` export below the existing `DELETE` handler:

```ts
export async function POST(req: NextRequest, ctx: RouteParams) {
  if (!(await readHost())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await ctx.params;

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action !== "start_prep") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const existing = await prisma.liveSession.findUnique({ where: { id: sessionId } });
  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (existing.status !== "open") {
    return NextResponse.json(
      { error: "Session is closed" },
      { status: 409 }
    );
  }

  if (existing.prepStartedAt) {
    return NextResponse.json({ prepStartedAt: existing.prepStartedAt });
  }

  const updated = await prisma.liveSession.update({
    where: { id: sessionId },
    data: { prepStartedAt: new Date() },
    select: { prepStartedAt: true },
  });

  return NextResponse.json({ prepStartedAt: updated.prepStartedAt });
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: No errors.

- [ ] **Step 4: Manual API check**

Start the dev server: `npm run dev` (in another shell).
Log in as host, create a session, then in the browser devtools console run (replace `<id>` with a real session id):

```js
await fetch(`/api/host/session/<id>`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start_prep" }) }).then(r => r.json())
```

Expected: `{ prepStartedAt: "2026-04-..." }`. Calling it again returns the same timestamp (idempotent).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/host/session/[sessionId]/route.ts
git commit -m "Add host start_prep POST and expose prepStartedAt on GET"
```

---

## Task 4: Host UI — "Start Prep for Everyone" button + avatars in participant lists

**Files:**
- Modify: `src/app/host/session/[sessionId]/_view.tsx`

- [ ] **Step 1: Import `Avatar` and add `prepStartedAt` to types/state**

At the top of `src/app/host/session/[sessionId]/_view.tsx`, add the import next to the other component imports:

```tsx
import { Avatar } from "@/components/live/Avatar";
```

Add a `Play` icon to the lucide imports (alongside the existing `Trophy`, `Users`, etc.):

```tsx
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  CircleDot,
  CircleSlash,
  Loader2,
  Trophy,
  Users,
  Play,
} from "lucide-react";
```

In the `SessionDetail` type (around line 43), add the field after `closedAt`:

```tsx
type SessionDetail = {
  id: string;
  code: string;
  eventCode: string;
  eventName: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
  prepStartedAt: string | null;
  scenario: string;
  performanceIndicators: string[];
  participants: Participant[];
};
```

- [ ] **Step 2: Add the `startPrep` mutation**

Inside `HostSessionView`, immediately after the `closeSession` mutation (around line 83), add:

```tsx
  const startPrep = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/host/session/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_prep" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start prep");
      }
      return res.json();
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["host-session", sessionId] });
    },
  });
```

- [ ] **Step 3: Render the Start Prep button next to Close**

Find the header `Button` block for `closeSession` (around line 134). Add the new button immediately before it (so it appears to the left of Close):

```tsx
            {open && !data.prepStartedAt && (
              <Button
                size="sm"
                onClick={() => startPrep.mutate()}
                disabled={startPrep.isPending || data.participants.length === 0}
              >
                {startPrep.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <><Play className="h-3.5 w-3.5 mr-1.5" /> Start Prep for Everyone</>
                )}
              </Button>
            )}
            {data.prepStartedAt && (
              <Badge variant="outline" className="gap-1">
                <Play className="h-3 w-3" /> Prep started{" "}
                {new Date(data.prepStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Badge>
            )}
```

- [ ] **Step 4: Render avatars in the leaderboard rows**

Replace the `ParticipantRow` function at the bottom of the file with:

```tsx
function ParticipantRow({ rank, participant }: { rank: number; participant: Participant }) {
  const medal =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-none">
      <span className="w-8 text-center font-semibold tabular-nums">
        {medal ?? `#${rank}`}
      </span>
      <Avatar seed={participant.id} displayName={participant.displayName} size="sm" />
      <span className="flex-1 font-medium">{participant.displayName}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">{participant.email}</span>
      <span className="font-mono font-semibold tabular-nums">
        {participant.totalScore ?? "—"}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Render avatars in the All Participants table**

Find the `<td>` cell that renders `{p.displayName}` inside the participants table (around line 249). Replace that cell with:

```tsx
                        <td className="py-2 pr-3 font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar seed={p.id} displayName={p.displayName} size="sm" />
                            {p.displayName}
                          </div>
                        </td>
```

- [ ] **Step 6: Add error display for the startPrep mutation**

Immediately under the closing `</header>` and before the `<main>` element, add:

```tsx
      {startPrep.isError && (
        <div className="max-w-6xl mx-auto px-6 mt-4">
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
            {startPrep.error instanceof Error ? startPrep.error.message : "Failed to start prep."}
          </div>
        </div>
      )}
```

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: No errors.

- [ ] **Step 8: Manual UI check**

With `npm run dev` running, log in as host, open a session page. Verify:
- "Start Prep for Everyone" button is visible next to "CSV" and "Close".
- Button is disabled while there are no participants.
- After clicking, button is replaced by a "Prep started HH:MM" badge.
- Each participant row shows a colored avatar with their initial.

- [ ] **Step 9: Commit**

```bash
git add src/app/host/session/[sessionId]/_view.tsx
git commit -m "Add host Start Prep button and avatars to participant views"
```

---

## Task 5: Participant API — expose `prepStartedAt` and `prepDurationSeconds`

**Files:**
- Modify: `src/app/api/live-session/roleplay/route.ts`

- [ ] **Step 1: Add `prepStartedAt` and `prepDurationSeconds` to the GET response**

Locate the `JSON.stringify({ ... })` payload returned at the end of `GET` (around line 51). Add the two new fields right after `sessionStatus`:

```ts
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
      roleplayScore: participant.roleplayScore,
      quizScore: participant.quizScore,
      combinedTotalScore: participant.totalScore,
      quizQuestions,
      quizSubmitted: !!participant.quizAnswersJson,
      sessionStatus: participant.session.status,
      prepStartedAt: participant.session.prepStartedAt,
      prepDurationSeconds: 600,
      displayName: participant.displayName,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
```

(`displayName` is also added because the lobby UI in Task 7 needs it for the avatar, and it's not currently in the response.)

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: No errors.

- [ ] **Step 3: Manual API check**

With dev server running, join a session as a participant, then in devtools:

```js
await fetch(`/api/live-session/roleplay?participantId=${myId}`).then(r => r.json())
```

Expected: response includes `prepStartedAt: null` (or an ISO string after host clicks Start Prep), `prepDurationSeconds: 600`, and `displayName`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/live-session/roleplay/route.ts
git commit -m "Expose prepStartedAt and displayName on participant GET"
```

---

## Task 6: `RoleplaySessionUI` — add `lobby` phase with server-anchored timer

**Files:**
- Modify: `src/components/roleplay/RoleplaySessionUI.tsx`

- [ ] **Step 1: Extend the `Phase` type and `RoleplaySessionData`**

In `src/components/roleplay/RoleplaySessionUI.tsx`, change the `Phase` type (around line 90) from:

```ts
type Phase = "prep" | "presenting" | "followup" | "quiz" | "results";
```

to:

```ts
type Phase = "lobby" | "prep" | "presenting" | "followup" | "quiz" | "results";
```

Extend `RoleplaySessionData` (around line 36) to include the new optional fields:

```ts
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
  prepStartedAt?: string | null;
  prepDurationSeconds?: number;
  displayName?: string;
}
```

- [ ] **Step 2: Add the `Avatar` import and a `lobbyEnabled` flag**

Add to the imports at the top:

```tsx
import { Avatar } from "@/components/live/Avatar";
```

Inside `RoleplaySessionUI`, replace the existing initial-phase state:

```ts
  const [phase, setPhase] = useState<Phase>("prep");
```

with logic that picks `lobby` for live sessions where prep hasn't started, otherwise `prep`:

```ts
  // Live-session pages pass `prepStartedAt` (string | null). Standalone roleplay
  // pages omit it, in which case we fall back to today's behavior (start in prep).
  const lobbyEnabled =
    sessionData?.prepStartedAt !== undefined && !sessionData.completed;
  const initialPhase: Phase =
    lobbyEnabled && !sessionData?.prepStartedAt ? "lobby" : "prep";
  const [phase, setPhase] = useState<Phase>(initialPhase);
```

- [ ] **Step 3: Replace the prep timer effect with a server-anchored computation**

Find the prep timer `useEffect` (around line 159). Replace it with:

```tsx
  useEffect(() => {
    if (phase !== "prep") return;

    const duration = sessionData?.prepDurationSeconds ?? 600;
    const startedAt = sessionData?.prepStartedAt
      ? new Date(sessionData.prepStartedAt).getTime()
      : null;

    const compute = () => {
      if (!startedAt) {
        // Standalone flow — start the clock the moment we entered `prep`.
        setPrepTimeLeft((prev) => Math.max(0, prev - 1));
        return;
      }
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setPrepTimeLeft(Math.max(0, duration - elapsed));
    };

    // Seed immediately so the first paint is correct.
    if (startedAt) {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setPrepTimeLeft(Math.max(0, duration - elapsed));
    }

    prepTimerRef.current = setInterval(compute, 1000);
    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    };
  }, [phase, sessionData?.prepStartedAt, sessionData?.prepDurationSeconds]);
```

- [ ] **Step 4: Add the lobby→prep transition effect**

Immediately after the prep timer effect, add:

```tsx
  useEffect(() => {
    if (phase === "lobby" && sessionData?.prepStartedAt) {
      setPhase("prep");
    }
  }, [phase, sessionData?.prepStartedAt]);
```

- [ ] **Step 5: Render the lobby UI**

Find the `{/* PREP */}` block (around line 493). Insert the lobby render block immediately above it:

```tsx
      {/* LOBBY */}
      {phase === "lobby" && (
        <div className="max-w-md mx-auto text-center py-16 space-y-6">
          {sessionData.displayName && (
            <Avatar
              seed={sessionData.id}
              displayName={sessionData.displayName}
              size="lg"
              className="mx-auto"
            />
          )}
          <div className="space-y-1">
            <p className="text-base font-semibold">
              You&apos;re in{sessionData.displayName ? `, ${sessionData.displayName}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              Waiting for the host to start the session…
            </p>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      )}
```

- [ ] **Step 6: Hide the prep-time header during lobby**

Inside the header at the top of the rendered tree, the prep-time pill is gated by `phase === "prep"` and the present-time pill by `presenting | followup`. No change needed — `lobby` shows neither, which is correct.

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/roleplay/RoleplaySessionUI.tsx
git commit -m "Add lobby phase with server-anchored prep timer to RoleplaySessionUI"
```

---

## Task 7: Participant page — pass new props and tune polling cadence

**Files:**
- Modify: `src/app/play/[participantId]/page.tsx`

- [ ] **Step 1: Extend `LiveSessionResponse` type**

In `src/app/play/[participantId]/page.tsx`, the type alias near the top is:

```tsx
type LiveSessionResponse = RoleplaySessionData & { sessionStatus: string };
```

The new fields (`prepStartedAt`, `prepDurationSeconds`, `displayName`) are already part of `RoleplaySessionData` after Task 6, so no change is needed here. Verify it compiles.

- [ ] **Step 2: Tune `refetchInterval` to poll faster while in lobby**

Find the `useQuery` block (around line 23). Replace the `useQuery` call with:

```tsx
  const { data, isLoading, error } = useQuery<LiveSessionResponse>({
    queryKey: ["live-participant", participantId],
    queryFn: async () => {
      const res = await fetch(`/api/live-session/roleplay?participantId=${participantId}`);
      if (res.status === 401 || res.status === 403) {
        throw new Error("unauth");
      }
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
    retry: false,
    refetchInterval: (query) => {
      const d = query.state.data;
      // Poll every 2s while waiting for the host to start prep, so the lobby
      // flips to prep promptly. Stop polling once prep has started — the timer
      // is computed locally from `prepStartedAt`.
      if (!d) return 2000;
      if (d.prepStartedAt) return false;
      return 2000;
    },
  });
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/play/[participantId]/page.tsx
git commit -m "Poll participant session every 2s while in lobby"
```

---

## Task 8: End-to-end manual verification

**Files:** None modified — this task is a manual smoke test against `npm run dev`.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Server up at `http://localhost:3000`.

- [ ] **Step 2: Create a session as host**

In one browser, navigate to `/host/login`, log in (password `password123`), create a new session. Note the join code.

- [ ] **Step 3: Join from two separate browsers/incognito windows**

In two separate browser profiles, go to `/play?code=<code>`, complete the join form with two different display names. Both should land on `/play/<participantId>` showing the **lobby** screen with their avatar and "Waiting for the host to start the session…".

- [ ] **Step 4: Verify host sees both participants with avatars**

Refresh the host page. Both participants should appear in the "All Participants" table with colored avatars (different gradients if their seeds differ).

- [ ] **Step 5: Click "Start Prep for Everyone"**

On the host page, click the button. Expected:
- Button is replaced by a "Prep started HH:MM" badge.
- Within ~2s, both participant browsers flip from lobby to the prep screen, both showing the same prep countdown (±2s).

- [ ] **Step 6: Refresh a participant mid-prep**

On one of the participant browsers, hard-refresh. The prep screen should re-render with the correct remaining time (resumed, not reset).

- [ ] **Step 7: Late-join check**

In a third browser, join the session. The participant should land directly in the prep screen with reduced time (not in lobby).

- [ ] **Step 8: Idempotency check**

In the host's devtools console, run the start_prep POST a second time. Expected: returns the original `prepStartedAt` timestamp; UI badge does not change.

- [ ] **Step 9: Closed-session check**

Close the session via the host's "Close" button, then in a fresh incognito try to navigate `/play?code=<code>`. Expected: join form rejects with "Session is closed" or similar (no regression in existing behavior).

- [ ] **Step 10: No commit needed for verification only**

If any of the above failed, file the issue back into the relevant task and re-iterate. Otherwise, the plan is complete.

---

## Self-review

- **Spec coverage:**
  - Schema `prepStartedAt` → Task 1 ✓
  - Avatar component → Task 2 ✓
  - Host POST `start_prep` + GET exposes `prepStartedAt` → Task 3 ✓
  - Host UI button + avatars → Task 4 ✓
  - Participant GET exposes `prepStartedAt` + `prepDurationSeconds` → Task 5 ✓
  - `RoleplaySessionUI` lobby phase + server-anchored timer → Task 6 ✓
  - Participant page polling cadence + new props → Task 7 ✓
  - Manual test plan from spec → Task 8 ✓
  - Quiz flow unchanged (spec non-goal) ✓
- **Placeholder scan:** No "TBD"/"TODO"/"similar to". All code shown verbatim.
- **Type consistency:** `prepStartedAt: string | null` on the wire (serialized DateTime), `Date` in the DB, parsed via `new Date(...)` in Task 6. `prepDurationSeconds: number` defaulted to 600 server-side, with client fallback `?? 600`.
