---
name: Generated API client response shape and route naming
description: How Orval-generated React Query hooks return data, and where to verify actual server route paths
---

Orval-generated hooks (e.g. `useGetFeed`, `useGetMyProfile`, `useCreateSwipe`) return the parsed response body directly — access fields like `data.profiles` or `data.profile` directly, never `data.data.x`. This applies uniformly across query and mutation hooks in this stack.

**Why:** Assuming an axios-style `{data: T}` wrapper (common in other codegen setups) causes silent `undefined` bugs that only surface as TS errors on nested `.data.data` access, or runtime crashes if `strict` typing is off.

**How to apply:** When wiring a new generated hook, destructure the hook result and inspect the type directly (e.g. via LSP hover or reading `api.schemas.ts`) rather than assuming a wrapper shape.

Also: never guess REST route paths from convention (e.g. assuming `/api/matching/feed` because the domain is "matching"). Always check `lib/api-spec/openapi.yaml` for the actual path — route names in this codebase are often flat and terse (e.g. `/feed`, `/swipe`, `/matches`, `/profile` under the `/api` prefix, not nested under a resource-group prefix).
