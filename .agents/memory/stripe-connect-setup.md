---
  name: Stripe Connect activation and account links
  description: Non-obvious steps to activate Stripe Connect on an account and constraints on account link URLs
  ---

  ## Activating Connect on a Stripe account
  A live Stripe account that has never used Connect will reject `stripe.accounts.create` with
  "You can only create new accounts if you've signed up for Connect". Signing up is not just
  visiting dashboard.stripe.com/connect — Stripe also requires acknowledging the **Platform
  profile** (dashboard.stripe.com/settings/connect/platform-profile → "Negative balance liability
  acknowledgement" and "Ongoing seller compliance acknowledgement" links). Until both are
  acknowledged, account creation keeps failing with a "review the responsibilities... platform-profile"
  error even though Connect looks "on" in the dashboard.

  **Why:** Stripe won't let a platform take on connected accounts without accepting liability terms;
  the account-creation API error message is generic and doesn't point directly at the acknowledgement
  buttons, so it's easy to get stuck clicking around unrelated onboarding wizards (e.g. the generic
  "how do you want to accept recurring payments" prompt, which is unrelated).

  **How to apply:** If `stripe.accounts.create` errors mentioning Connect or platform-profile,
  send the user straight to the platform-profile settings page and have them click any
  "Acknowledge" links there, rather than the general Connect settings/onboarding pages.

  ## Account link URLs must be https
  `stripe.accountLinks.create` (used for Connect onboarding) rejects custom app URL schemes
  (e.g. `myapp://...`) for `refresh_url`/`return_url` with "Not a valid URL" — even though
  Stripe Checkout's `success_url`/`cancel_url` do accept custom schemes for mobile apps.

  **Why:** Checkout sessions and account links validate return URLs differently; only Checkout
  supports deep-link schemes directly.

  **How to apply:** For Connect onboarding in a mobile app, host tiny server-side HTML redirect
  pages at real `https://` URLs (e.g. `/stripe/connect/redirect/return`) that immediately
  `window.location.replace` to the app's custom deep link, and pass those https URLs as
  refresh_url/return_url instead of the raw deep link.
  