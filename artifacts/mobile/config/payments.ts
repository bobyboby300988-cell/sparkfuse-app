import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

// Personal PayPal account that still receives subscription payments made via
// the PayPal option on the paywall. Update this in one place if it changes.
export const PAYPAL_BUSINESS_EMAIL = "dumitru8830@gmail.com";

export function buildPayPalCheckoutUrl(opts: {
  amountEur: number;
  itemName: string;
  returnUrl?: string;
  cancelUrl?: string;
}): string {
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: PAYPAL_BUSINESS_EMAIL,
    amount: opts.amountEur.toFixed(2),
    currency_code: "EUR",
    item_name: opts.itemName,
  });
  if (opts.returnUrl) params.set("return", opts.returnUrl);
  if (opts.cancelUrl) params.set("cancel_return", opts.cancelUrl);
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

export const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "https://match-maker-2025ap.replit.app/api";

// Custom scheme deep links (see app.json "scheme": "mobile") that Stripe
// Checkout redirects back into the app on completion/cancellation.
const CHECKOUT_SUCCESS_URL = "mobile://checkout-success";
const CHECKOUT_CANCEL_URL = "mobile://checkout-cancel";

// Buys Spark Tokens with a real Stripe Checkout payment. Only resolves
// `true` once the Checkout Session is confirmed paid server-side — nothing
// is credited on the strength of the app merely returning from the browser.
//
// On native, we open an in-app auth session and can await the redirect back
// into the app via the custom `mobile://` scheme. On web, custom schemes
// don't exist — Stripe has to redirect back to a real http(s) URL, which
// means the whole page reloads. In that case this function never "returns"
// (the page navigates away); the pending purchase is instead recovered via
// `checkPendingWebTokenCheckout()` on the next page load.
export async function buyTokensWithStripe(tokens: number, priceEur: number): Promise<boolean> {
  const isWeb = Platform.OS === "web" && typeof window !== "undefined";
  const origin = isWeb ? window.location.origin + window.location.pathname : "";
  const successUrl = isWeb
    ? `${origin}?stripe_status=success&session_id={CHECKOUT_SESSION_ID}&tokens=${tokens}`
    : CHECKOUT_SUCCESS_URL;
  const cancelUrl = isWeb ? `${origin}?stripe_status=cancel` : CHECKOUT_CANCEL_URL;

  const createRes = await fetch(`${API_BASE}/stripe/token-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens, priceEur, successUrl, cancelUrl }),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Could not start checkout");
  }
  const { url, sessionId } = (await createRes.json()) as { url: string; sessionId: string };

  if (isWeb) {
    window.location.href = url;
    return new Promise<boolean>(() => {}); // page is navigating away
  }

  const result = await WebBrowser.openAuthSessionAsync(url, CHECKOUT_SUCCESS_URL);
  if (result.type !== "success") return false;

  const verifyRes = await fetch(`${API_BASE}/stripe/checkout-session/${sessionId}`);
  if (!verifyRes.ok) return false;
  const data = (await verifyRes.json()) as { paymentStatus: string };
  return data.paymentStatus === "paid";
}

// On web, checks whether we just came back from a Stripe token-purchase
// redirect (`?stripe_status=success&session_id=...&tokens=...`), verifies
// the session server-side, and returns the number of tokens to credit.
// Always clears the query params immediately so a page refresh can't
// double-credit. Returns null if there's nothing to recover, or if the
// session isn't actually paid.
export async function checkPendingWebTokenCheckout(): Promise<{ tokens: number } | null> {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const status = params.get("stripe_status");
  const sessionId = params.get("session_id");
  const tokensParam = params.get("tokens");

  if (!status) return null;

  // Clear the query params right away so refreshing doesn't re-trigger this.
  window.history.replaceState({}, "", window.location.pathname);

  if (status !== "success" || !sessionId) return null;

  const res = await fetch(`${API_BASE}/stripe/checkout-session/${sessionId}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { paymentStatus: string; metadata?: Record<string, string> };
  if (data.paymentStatus !== "paid") return null;

  const tokens = tokensParam ? parseInt(tokensParam, 10) : parseInt(data.metadata?.tokens ?? "0", 10);
  return tokens > 0 ? { tokens } : null;
}

// Buys Spark Tokens via the personal PayPal direct-payment link. PayPal
// doesn't give us a server-verifiable session like Stripe Checkout does, so
// this resolves `true` as soon as the user returns from the PayPal browser.
export async function buyTokensWithPayPal(tokens: number, priceEur: number): Promise<boolean> {
  const url = buildPayPalCheckoutUrl({
    amountEur: priceEur,
    itemName: `Spark ${tokens} Tokens`,
  });
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
  });
  return true;
}
