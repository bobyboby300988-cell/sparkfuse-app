import * as WebBrowser from "expo-web-browser";

// Personal PayPal account that still receives subscription payments made via
// the PayPal option on the paywall. Update this in one place if it changes.
export const PAYPAL_BUSINESS_EMAIL = "dumitru8830@gmail.com";

export function buildPayPalCheckoutUrl(opts: {
  amountEur: number;
  itemName: string;
}): string {
  const params = new URLSearchParams({
    cmd: "_xclick",
    business: PAYPAL_BUSINESS_EMAIL,
    amount: opts.amountEur.toFixed(2),
    currency_code: "EUR",
    item_name: opts.itemName,
  });
  return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

export const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "https://match-maker-dumitru8830.replit.app/api";

// Custom scheme deep links (see app.json "scheme": "mobile") that Stripe
// Checkout redirects back into the app on completion/cancellation.
const CHECKOUT_SUCCESS_URL = "mobile://checkout-success";
const CHECKOUT_CANCEL_URL = "mobile://checkout-cancel";

// Buys Spark Tokens with a real Stripe Checkout payment. Only resolves
// `true` once the Checkout Session is confirmed paid server-side — nothing
// is credited on the strength of the app merely returning from the browser.
export async function buyTokensWithStripe(tokens: number, priceEur: number): Promise<boolean> {
  const createRes = await fetch(`${API_BASE}/stripe/token-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tokens,
      priceEur,
      successUrl: CHECKOUT_SUCCESS_URL,
      cancelUrl: CHECKOUT_CANCEL_URL,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Could not start checkout");
  }
  const { url, sessionId } = (await createRes.json()) as { url: string; sessionId: string };

  const result = await WebBrowser.openAuthSessionAsync(url, CHECKOUT_SUCCESS_URL);
  if (result.type !== "success") return false;

  const verifyRes = await fetch(`${API_BASE}/stripe/checkout-session/${sessionId}`);
  if (!verifyRes.ok) return false;
  const data = (await verifyRes.json()) as { paymentStatus: string };
  return data.paymentStatus === "paid";
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
