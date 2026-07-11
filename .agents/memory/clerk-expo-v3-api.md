---
name: Clerk Expo v3 / React v6 Signal API
description: The new signal-based auth API introduced in @clerk/expo v3 + @clerk/react v6 — completely different from legacy hooks.
---

## The new API (v3/v6)

`useSignIn()` returns `{ signIn: SignInFutureResource, errors, fetchStatus: 'idle' | 'fetching' }`
`useSignUp()` returns `{ signUp: SignUpFutureResource, errors, fetchStatus: 'idle' | 'fetching' }`

No `setActive`, no `isLoaded`.

### Sign In
```ts
const { error } = await signIn.password({ emailAddress, password });
if (!error && signIn.status === 'complete') {
  await signIn.finalize(); // activates the session (replaces setActive)
}
```

### Sign Up
```ts
// Step 1: create account
const { error: createErr } = await signUp.password({ emailAddress, password });
// Step 2: send email verification
const { error: sendErr } = await signUp.verifications.sendEmailCode();
// Step 3: verify code
const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
if (!verifyErr && signUp.status === 'complete') {
  await signUp.finalize(); // activates the session
  router.replace('/onboarding');
}
```

### Loading check
- Use `fetchStatus === 'fetching'` or a local `loading` state — NOT `!isLoaded`

### Error shape
- Methods return `{ error: ClerkError | null }` (check inline, don't rely on throw)
- Also wrap in try/catch for older path errors using `err?.errors?.[0]?.code`

**Why:** `@clerk/expo` v3 (paired with `@clerk/react` v6) redesigned hooks around alien-signals for reactive state. The old `useSignIn` returning `{ signIn, setActive, isLoaded }` is gone. The new `SignInFutureResource` / `SignUpFutureResource` have `finalize()` instead of the global `setActive`.

**How to apply:** Any new custom sign-in/sign-up flow must use `signIn.password()` + `signIn.finalize()` and `signUp.password()` + `signUp.verifications.sendEmailCode()` / `verifyEmailCode()` + `signUp.finalize()`.
