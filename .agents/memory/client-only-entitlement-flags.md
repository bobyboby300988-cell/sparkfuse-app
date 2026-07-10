---
name: Client-only entitlement flags
description: Why device-local subscription/premium flags break across reinstalls and devices, and the fix pattern.
---

If "is this user subscribed/premium" is stored only in device-local storage (e.g. AsyncStorage) and set optimistically after a payment redirect, a user who reinstalls the app or logs into the same account on a new device will be asked to pay again — the app has no way to know they already paid.

**Why:** Payment success is a one-time client-side event (browser/webview closes, app calls `setSubscribed()`), but that event doesn't persist anywhere the server or another device can see.

**How to apply:** Persist the entitlement on the user's account row in the database (e.g. `isSubscribed` + `subscribedAt` on the users table), expose it in the "current user" endpoint, and have the client treat the server value as the source of truth (reconcile local state from it), only using local storage as an optimistic cache. Add a dedicated "activate subscription" endpoint the client calls right after a successful payment redirect, rather than only flipping local state.
