---
name: Clerk layout unmount during sign-up
description: _layout.tsx must not show a loading spinner on auth pages mid-flow or it unmounts the form and wipes state.
---

## Rule
When `_layout.tsx` has a `if (!isLoaded) return <Spinner />` guard, exclude sign-up and sign-in pages from it.

**Why:** Clerk's signal-based API briefly sets `isSignedIn=true` when `signUp.password()` runs (before email verification completes). This causes `isLoaded` to recalculate as `false` in `_layout.tsx`, which unmounts the entire sign-up screen and wipes all React state — email, password, `pendingVerification` — making the page appear to "reload" blank.

**How to apply:**
```ts
const inAuthPage = segments[0] === "sign-up" || segments[0] === "sign-in";
if (!isLoaded && !inAuthPage) {
  return <ActivityIndicator />;
}
```
