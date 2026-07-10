---
name: Expo app web-browser access
description: How to make an Expo Router mobile app (built for Expo Go distribution) also viewable in a regular web browser in production.
---

Expo apps in this project are typically built for Expo Go (native) distribution only — `scripts/build.js` bundles iOS/Android manifests and `server/serve.js` serves them plus a "scan this QR code" landing page to browsers. That landing page is NOT a real web app; it can't be used to satisfy a "make it accessible from a browser" request.

**Solution:** `expo export -p web --output-dir static-build/web --clear` produces a working single-page web build (index.html + JS bundle + assets) as long as `react-native-web` is already a dependency (it is, by default, in Expo SDK 54 projects). No `app.json` web config changes were needed.

Server-side, route by the presence of the `expo-platform` request header:
- Header present (`ios`/`android`) → existing native manifest/bundle serving logic.
- Header absent (real browser) → serve from `static-build/web`, with a fallback to `index.html` for extensionless paths (SPA/expo-router client-side routing), since the export only produces one `index.html`, not per-route static HTML.

**Why:** Without this, "the app isn't reachable by web browser" is a permanent limitation of Expo Go-only deployments, and users who don't have Expo Go / a physical device installed cannot access the product at all.

**Gotcha:** `expo export -p web` and the existing native static export both use Metro and can port-conflict with other artifacts' dev servers (e.g. a mockup-sandbox Vite server sitting on 8081) when test-run manually in the dev sandbox — this is a dev-environment-only conflict, not a production issue, since production builds run in an isolated container.

**Gotcha (important):** all `EXPO_PUBLIC_*` vars (Clerk publishable key, API domain, etc.) are inlined into the bundle at `expo export` time, not read at runtime. If the build script's env for the web export step doesn't explicitly map a secret (e.g. `CLERK_PUBLISHABLE_KEY` → `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`), the web bundle ships with that value undefined. Symptom observed: Clerk never initializes on web, the app's auth/paywall redirect guard effect never runs (stuck waiting on `isLoaded`), and the browser silently lands on the default tab route with no login or paywall gate at all — easy to mistake for a routing bug when it's actually a missing-env-var-at-build-time bug. Always diff the web-export env against the known-working dev-script env line by line.

**Gotcha (important):** the server must send explicit `Cache-Control` headers when serving the exported `index.html` (`no-cache, no-store, must-revalidate`) versus hashed static assets under `_expo/static` (safe to send `public, max-age=31536000, immutable`). Without an explicit no-cache directive on `index.html`, browsers can keep serving a stale cached shell that points at an old JS bundle URL — so every subsequent bug fix + republish appears to have "no effect" for a user whose browser already cached the old (buggy) `index.html`, even though `curl` against the server shows the new, correct file. This can look identical to a real regression and wastes a lot of debugging time; check response cache headers early when "the fix isn't showing up" for one user's browser specifically.
