# Synchronized Prep Start + Basic Avatars for Live Sessions

**Date:** 2026-04-26
**Status:** Approved (design)

## Problem

1. **Unsynchronized prep.** Each live-session participant's 10-minute prep timer starts the moment they land on `/play/[participantId]`. Players who join earlier are further into prep than players who join later — there is no shared start. The host has no way to start prep simultaneously for the room.
2. **No visual identity.** Participants in the lobby and on the leaderboard show only as a display name. A minimal avatar makes the lobby feel more alive and helps players spot themselves at a glance.

## Goal

1. Give the host a single "Start Prep for Everyone" button that synchronizes the start of the prep phase across all currently-joined participants. After prep starts, the existing per-player flow (player clicks "I'm Ready — Start Presentation" when ready) is unchanged.
2. Give every participant a deterministic, auto-generated avatar — no user choice, no uploads. Render it in the host's participant list and on the participant's own UI.

This is Option A from brainstorming for prep sync: one host button (start prep). No host control over the prep→presenting transition; each player still triggers their own presentation.

## Existing quiz flow (no changes)

For completeness — this is already built and is **not** changing in this spec:

- After a participant ends the roleplay, the server (`POST /api/live-session/roleplay` with `action: "end_session"`) generates a 10-question multiple-choice quiz keyed to the event.
- The participant answers all 10 in `RoleplaySessionUI`'s quiz phase, then submits via `action: "submit_quiz"`.
- Each question is worth 10 points → `quizScore` is /100. `roleplayScore` is /100. Final `totalScore = round((roleplayScore + quizScore) / 2 * 10) / 10`.
- Stored on `LiveParticipant`: `quizQuestionsJson`, `quizAnswersJson`, `quizScore`, `totalScore`.

This spec touches none of that.

## Non-goals

- Host control of the prep→presenting transition (deferred — players still self-trigger).
- Real-time push (WebSockets / SSE). Polling at the existing cadence is sufficient.
- Changes to the standalone (non-live) `/roleplay` flow.
- Changes to scoring or quiz flows.
- User-selected avatars, emoji pickers, or image uploads.

## Architecture

### Avatars

Pure-derivation, no schema, no storage:

- A small client-side helper `getAvatar(seed: string): { initial: string; bg: string }` takes a stable seed (use `LiveParticipant.id`, falling back to `displayName`) and returns:
  - `initial`: first uppercase letter of `displayName`.
  - `bg`: one of ~10 hardcoded Tailwind gradient classes, picked by `hash(seed) % palette.length`.
- Rendered as a `<div>` with `rounded-full`, the gradient bg, and the initial centered.
- Lives at `src/components/live/Avatar.tsx`. Used in:
  - Host participant table and leaderboard rows (`_view.tsx`).
  - Participant lobby screen ("You're in: [avatar] [displayName]").
- No API or schema changes. The seed is already in the existing GET responses.

### Source of truth (prep sync)

`LiveSession.prepStartedAt: DateTime?`

- `null` until the host clicks "Start Prep for Everyone".
- Set once, server-side, to `new Date()`. Idempotent — subsequent host clicks are no-ops.
- Read by both host and participant clients via existing GET endpoints.

Prep duration is a client-known constant (`PREP_DURATION_SECONDS = 600`). All clients compute `prepTimeLeft = max(0, 600 - (Date.now() - prepStartedAt))`, so clocks drift by at most the network round-trip.

### Phases (participant)

A new `"lobby"` phase is added before `"prep"` for live sessions only:

```
lobby → prep → presenting → followup → quiz → results
```

- `lobby`: shown while `prepStartedAt` is `null`. Displays "Waiting for host to start…" and the scenario is *not* shown yet.
- `prep`: shown once `prepStartedAt` is non-null. Scenario, PIs, 21st-century skills, and the synchronized countdown are visible. Player clicks "I'm Ready — Start Presentation" to advance.
- All later phases: unchanged.

The standalone `/roleplay` flow does not use `lobby` — it starts directly in `prep` as today.

### Polling

The participant page already polls via React Query. While in `lobby`, refetch every **2s** so the prep-start is detected quickly. Once `prepStartedAt` is set, drop back to a slower interval (or stop refetching the session metadata) — the timer is computed locally from the timestamp.

## Components and data flow

### 1. Schema

`prisma/schema.prisma`:

```prisma
model LiveSession {
  // ...existing fields...
  prepStartedAt DateTime?
  // ...
}
```

Migration: add nullable column. No backfill needed — existing/closed sessions leave it `null`.

### 2. Host API (`src/app/api/host/session/[sessionId]/route.ts`)

Add `POST` handler:

- Auth: `readHost()` (existing).
- Body: `{ action: "start_prep" }`.
- If session not found → 404. If `status !== "open"` → 409. If `prepStartedAt` already set → return current value (idempotent, 200).
- Otherwise: `prepStartedAt = new Date()`, return `{ prepStartedAt }`.

Update `GET` to include `prepStartedAt` in the response.

### 3. Host UI (`src/app/host/session/[sessionId]/_view.tsx`)

- Add `prepStartedAt: string | null` to `SessionDetail` type.
- Add a `useMutation` for `startPrep` that POSTs `{ action: "start_prep" }`.
- Render a button near the join-code card:
  - If `prepStartedAt == null` and `open`: "Start Prep for Everyone" (primary).
  - If `prepStartedAt != null`: small badge "Prep started at HH:MM" (disabled).
  - If session closed: hidden.
- After mutation, invalidate the host-session query so the badge updates.

### 4. Participant API (`src/app/api/live-session/roleplay/route.ts`)

`GET` response: include `prepStartedAt` (ISO string or null) and `prepDurationSeconds: 600`.

No `POST` changes.

### 5. Participant page (`src/app/play/[participantId]/page.tsx`)

- Add `prepStartedAt` and `prepDurationSeconds` to `LiveSessionResponse`.
- Adjust `useQuery`:
  - `refetchInterval`: `2000` while `data?.prepStartedAt == null`, else `false` (or keep current behavior for completion polling).
- Pass new fields into `RoleplaySessionUI`.

### 6. `RoleplaySessionUI` (`src/components/roleplay/RoleplaySessionUI.tsx`)

- Extend `Phase` to `"lobby" | "prep" | "presenting" | "followup" | "quiz" | "results"`.
- Add optional props: `prepStartedAt?: string | null`, `prepDurationSeconds?: number`.
- Initial phase logic:
  - If `prepStartedAt` prop is provided and is `null` → start in `"lobby"`.
  - If `prepStartedAt` is non-null → start in `"prep"` with `prepTimeLeft = max(0, duration - elapsed)`.
  - If prop is `undefined` (standalone flow) → start in `"prep"` with full duration (today's behavior).
- Lobby UI: centered card with the participant's `<Avatar />` + display name + spinner + "Waiting for host to start the session…".
- When phase is `"lobby"` and incoming `prepStartedAt` becomes non-null, transition to `"prep"` and seed `prepTimeLeft` from the server timestamp.
- Once in `"prep"`, the existing 1s interval continues to drive the countdown; on each tick, recompute from `prepStartedAt` rather than decrementing local state, so clock skew can't accumulate.

## Error handling

- Host clicks Start Prep on a closed session → 409, surfaced as a toast/inline error.
- Host clicks Start Prep twice → second call is a no-op (returns existing `prepStartedAt`).
- Participant joins after prep started → lands directly in `prep` with reduced time. If `now - prepStartedAt > 600s`, `prepTimeLeft = 0` and they can immediately start presenting.
- Participant's clock is skewed: timer is computed from `Date.now() - prepStartedAt`, so a skewed client drifts but recovers on next refetch (acceptable; absolute accuracy is not required).
- Network blip during host start: button stays clickable (idempotent retry safe).

## Testing plan

Manual:
1. Host creates a session. Two browsers join. Both see lobby with their avatars.
2. Host's participant table and leaderboard show the same avatars (consistent across views).
3. Host clicks Start Prep. Within ~2s, both browsers flip to prep with the same number on the clock (±2s).
4. A third browser joins after Start Prep — lands in prep with reduced time.
5. Refresh a participant mid-prep — clock resumes at the correct remaining time, avatar identical.
6. Host clicks Start Prep twice — no error, badge shows original timestamp.
7. Close session before Start Prep — button hidden / disabled.
8. Two players with the same first letter get distinguishable avatars (different gradients).

## Open trade-offs (acknowledged, accepted)

- **Polling cadence in lobby.** 2s gives "feels instant" with negligible cost. Could be 1s; not worth it.
- **No prep→presenting sync.** Players self-trigger. Adding host-controlled presenting start is a future option (Option B from brainstorming).
- **Server clock as truth.** Clients trust the returned `prepStartedAt` against their local `Date.now()`. Drift across clients is bounded by individual clock skew, typically sub-second.
