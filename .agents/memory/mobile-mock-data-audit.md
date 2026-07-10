---
name: SparkFuse mobile mock/demo data audit
description: Which tabs in the SparkFuse dating app use static seed data vs real backend data, and what breaks when it's emptied.
---

## What's real vs mock (as of this audit)

- **Discover tab** (`(tabs)/index.tsx`): real — uses `useGetFeed` API data. Only falls back to a placeholder `p1.png` image when a real user hasn't uploaded a photo. Not fake profiles.
- **Live tab** (`(tabs)/live.tsx`) and **Coaches tab** (`(tabs)/coaches.tsx`): were fully backed by static seed arrays (`LIVE_STREAMS`, `MOCK_COACHES`) with no real data source. Emptied to `[]` per user request — sections now show an empty state until real users/coaches exist. Live tab already had real-session polling merged in alongside the mock array.
- **Explore tab** (`(tabs)/explore.tsx`): still backed by `ALL_PROFILES` static seed data (`data/allProfiles.ts`) — out of scope for the "remove Live/Coaches" request but is the same category of fake content if this comes up again.

## Why: emptying seed arrays isn't just data deletion

**Why:** several screens index into these arrays with a fallback pattern like `arr.find(...) ?? arr[0]`, which crashes when the array is empty (`arr[0]` is `undefined`). Auto-looping demo effects (fake chat messages, fake viewer counts) also divide/modulo by array length and break on `length === 0`.

**How to apply:** when asked to remove/empty demo data anywhere in this app, grep every consumer of the array first (not just the tab screen) — detail screens reached by id (e.g. `live/[id].tsx`, `coach/[id].tsx`, `book/[id].tsx`) need a safe fallback object or an explicit "not found" guard, and any interval/effect that indexes by modulo needs a `length === 0` early return.
