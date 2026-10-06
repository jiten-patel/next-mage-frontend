import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { gql, MagentoError } from "./magento";

/**
 * @typedef {{ value: number, currency: string }} Money
 * @typedef {{ firstname: string, lastname: string, email: string, default_billing: string|null, default_shipping: string|null }} Customer
 * @typedef {{ id: number, firstname: string, lastname: string, company: string|null, street: string[], city: string,
 *   region: { region: string|null, region_code: string|null, region_id: number|null }|null, postcode: string|null,
 *   country_code: string, telephone: string|null, default_billing: boolean, default_shipping: boolean }} CustomerAddress
 * @typedef {{ id: string, product_name: string, product_sku: string, quantity_ordered: number, product_sale_price: Money,
 *   prices: { row_total: Money }, selected_options: { label: string, value: string }[] }} CustomerOrderItem
 * @typedef {{ number: string, order_date: string, status: string, total: { grand_total: Money, subtotal_excl_tax: Money,
 *   total_shipping: Money, total_tax: Money, discounts: { amount: Money, label: string }[] },
 *   items?: CustomerOrderItem[] }} CustomerOrder
 * @typedef {{ generateCustomerToken: { token: string } }} AuthenticationResponse
 * @typedef {{ token: string }} Session  The Magento customer token, held only in an HttpOnly cookie.
 * @typedef {{ error?: string, success?: string, fieldErrors?: Record<string, string>, values?: Record<string, string> }} FormState
 */

const COOKIE = "customer_token";
const CUSTOMER = `{ customer { firstname lastname email default_billing default_shipping } }`;

export const isAuthError = (e) =>
  e instanceof MagentoError && ["graphql-authentication", "graphql-authorization"].includes(e.category);

// Customer-safe text for any thrown error. Magento's own messages are shown only for input
// validation (written for shoppers); everything else may carry paths/traces in developer mode.
export function friendlyError(e, fallback = "Something went wrong. Please try again.") {
  if (!(e instanceof MagentoError)) throw e; // includes Next's redirect/notFound signals
  if (e.category === "unavailable") return "We couldn't reach the store right now. Please try again shortly.";
  // ponytail: denylist heuristic; graphql-input sometimes carries internals ("No such entity with customerId = 0").
  if (e.category === "graphql-input" && !/entity|\w+Id\b|sql|exception|[/\\]/i.test(e.message)) return e.message;
  console.error("Magento error:", e.category, e.message);
  return fallback;
}

export async function getPasswordPolicy() {
  const { storeConfig: c } = await gql(`{ storeConfig { minimum_password_length required_character_classes_number } }`);
  return { minLength: Number(c.minimum_password_length) || 8, classes: Number(c.required_character_classes_number) || 0 };
}

export async function startSession(token) {
  // Magento tokens expire a fixed number of hours after issue; the cookie dies with it.
  const { storeConfig } = await gql(`{ storeConfig { customer_access_token_lifetime } }`);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // localhost dev runs over plain http
    sameSite: "lax",
    path: "/",
    maxAge: Math.round((storeConfig.customer_access_token_lifetime || 1) * 3600),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  // Kill the token at Magento too, so a copied cookie stops working. Best effort: the cookie goes regardless.
  if (token) await gql(`mutation { revokeCustomerToken { result } }`, {}, { token }).catch(() => {});
  jar.delete(COOKIE);
}

/** The raw session token, unvalidated. For server-side Magento calls only; never send it to the browser. */
export const getToken = async () => (await cookies()).get(COOKIE)?.value;

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

const fetchCustomer = cache(async (token) => (await gql(CUSTOMER, {}, { token })).customer);

/** For rendering session-aware UI (header, login page): the customer, or null when logged out/expired. @returns {Promise<Customer|null>} */
export async function getCustomer() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await fetchCustomer(token);
  } catch (e) {
    if (isAuthError(e)) return null;
    throw e;
  }
}

// No session → /login; Magento rejects the token (expired/revoked) → /session-expired, which clears the cookie.
// Magento reuses the auth categories for a wrong password or "not your address", so an auth error only
// ends the session if the token itself no longer works; otherwise it's rethrown for the caller.
async function withSession(fn) {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) redirect("/login");
  try {
    return await fn(token);
  } catch (e) {
    if (isAuthError(e) && !(await gql(CUSTOMER, {}, { token }).then(() => true, (err) => !isAuthError(err)))) {
      redirect("/session-expired");
    }
    throw e;
  }
}

/** The only way protected pages/actions query Magento as the customer. */
export const customerQuery = (query, variables) => withSession((token) => gql(query, variables, { token }));

/** @returns {Promise<Customer>} */
export const requireCustomer = () => withSession(fetchCustomer);
