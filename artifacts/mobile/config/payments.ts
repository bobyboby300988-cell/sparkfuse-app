// Personal PayPal account that receives all direct payments (tokens, gifts,
// subscriptions, bookings). Update this in one place if the account changes.
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
