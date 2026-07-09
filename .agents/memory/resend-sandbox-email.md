---
  name: Resend sandbox email sending
  description: Correct default from-address for sending test emails via Resend without a verified domain
  ---

  Resend's built-in sandbox/test sending domain is `onboarding@resend.dev` — not `onboarding@resend.com`.
  Using the `.com` variant fails with a 403 "domain is not verified" error even with a valid API key.

  **Why:** easy to guess wrong since the product's marketing domain is resend.com, but the transactional
  sandbox sender lives on resend.dev.

  **How to apply:** for any one-off/internal notification email (e.g. notifying an app owner of an event)
  where verifying a custom domain isn't worth it yet, use `onboarding@resend.dev` as the from address.
  