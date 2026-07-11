---
name: Clerk Expo v3 / React v6 Signal API
description: The signal-based auth API in @clerk/expo v3 + @clerk/react v6. Confirmed working methods and known pitfalls.
---

## The API (confirmed by TypeScript)

`useSignUp()` returns `SignUpSignalValue`: `{ signUp: SignUpFutureResource, fetchStatus }`  
`useSignIn()` returns `SignInSignalValue`: `{ signIn: SignInFutureResource, fetchStatus }`  
No `setActive`, no `isLoaded` on these hooks.

### Sign Up (confirmed compiling)
```ts
const { signUp, fetchStatus } = useSignUp();

// Step 1: create account
const { error: createErr } = await signUp.password({ emailAddress, password });
// Step 2: send email verification
const { error: sendErr } = await signUp.verifications.sendEmailCode();
// Step 3: verify code
const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
if (!verifyErr && signUp.status === 'complete') {
  await signUp.finalize(); // activates the session (replaces setActive)
  router.replace('/onboarding');
}
```

### Sign In (confirmed compiling)
```ts
const { signIn, fetchStatus } = useSignIn();
const { error } = await signIn.password({ emailAddress, password });
if (!error && signIn.status === 'complete') {
  await signIn.finalize();
  router.replace('/');
}
```

## Critical pitfalls

1. **`signUp` / `signIn` can be null** — always check and show a visible error, never silently `return`.
   ```ts
   if (!signUp || fetchStatus === 'fetching') {
     setErrorMsg("Still loading — please wait a moment and try again.");
     return;
   }
   ```

2. **Do NOT use `fetchStatus === 'fetching'` to disable the button on mount.** During post-payment redirect reloads, Clerk reinitialises and `fetchStatus` is `'fetching'` immediately — the button renders as disabled/spinning before the user ever touches it. Use a local `loading` state only.

3. **`_layout.tsx` loading guard must skip auth pages** — `signUp.password()` briefly sets `isSignedIn=true`, which causes `isLoaded` to go `false` and unmounts the sign-up screen, wiping all form state (looks like a "reload"). Fix: `if (!isLoaded && !inAuthPage) return <Spinner />;`

4. **`SignUpFutureResource` does NOT have** `create()`, `prepareEmailAddressVerification()`, or `attemptEmailAddressVerification()` — those are the legacy `SignUpResource` methods.

**Why:** @clerk/expo v3.7.1 / @clerk/react v6.12.0 uses alien-signals. The hook shape and method names are completely different from the legacy API.
