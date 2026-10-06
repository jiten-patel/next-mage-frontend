import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { gql, MagentoError } from "./magento";
import { getToken, isAuthError } from "./auth";

/**
 * @typedef {{ value: number, currency: string }} Money
 * @typedef {{ uid: string, quantity: number, is_available: boolean, not_available_message: string|null,
 *   errors: { message: string }[]|null, product: { name: string, sku: string, url_key: string, small_image: { url: string, label: string }|null },
 *   prices: { price: Money, row_total: Money } }} CartItem
 * @typedef {{ total_quantity: number, itemsV2: { items: CartItem[] }, prices: { subtotal_excluding_tax: Money,
 *   discounts: { label: string, amount: Money }[]|null, applied_taxes: { label: string, amount: Money }[], grand_total: Money } }} Cart
 */

// Guests: Magento's masked cart id in an HttpOnly cookie (it's the only key to the cart).
// Customers: Magento's customerCart, reached with the session token, so no cookie needed.
const COOKIE = "cart_id";
const MONEY = "value currency";

// No `id`: this object is rendered (mini-cart props), and the masked id alone grants access to a guest cart.
// ponytail: first 100 lines only; paginate itemsV2 if carts get that big.
const CART_FIELDS = `
  total_quantity
  applied_coupons { code }
  shipping_addresses { selected_shipping_method { carrier_title amount { ${MONEY} } } }
  itemsV2(pageSize: 100) {
    items {
      uid quantity is_available not_available_message
      errors { message }
      product { name sku url_key small_image { url label } }
      prices { price { ${MONEY} } row_total { ${MONEY} } }
      ... on ConfigurableCartItem {
        configurable_options { option_label value_label }
        configured_variant { small_image { url label } }
      }
      ... on BundleCartItem { bundle_options { label values { label quantity } } }
      ... on DownloadableCartItem { links { title } }
    }
  }
  prices {
    subtotal_excluding_tax { ${MONEY} }
    discounts { label amount { ${MONEY} } }
    applied_taxes { label amount { ${MONEY} } }
    grand_total { ${MONEY} }
  }
`;

// An expired/revoked customer token falls back to guest, matching the header (getCustomer → null).
async function owner() {
  const token = await getToken();
  if (token) {
    try {
      const { customerCart } = await gql(`{ customerCart { id } }`, {}, { token });
      return { id: customerCart.id, token };
    } catch (e) {
      if (!isAuthError(e)) throw e;
    }
  }
  return { id: (await cookies()).get(COOKIE)?.value };
}

const isGone = (e) => e instanceof MagentoError && e.category === "graphql-no-such-entity";

const ADDRESS = "firstname lastname company street city postcode telephone region { region_id label } country { code label }";
const CHECKOUT_FIELDS = `
  email is_virtual
  shipping_addresses {
    ${ADDRESS}
    available_shipping_methods { carrier_code method_code carrier_title method_title amount { ${MONEY} } available error_message }
    selected_shipping_method { carrier_code method_code carrier_title method_title amount { ${MONEY} } }
  }
  billing_address { ${ADDRESS} }
  available_payment_methods { code title }
  selected_payment_method { code }
`;

/** Current cart, or null when there's none yet (or the guest cart expired / was ordered). @returns {Promise<Cart|null>} */
export const getCart = cache(() => fetchCart(CART_FIELDS));

/** getCart plus addresses, shipping/payment methods and coupons. Separate because rate collection is slow and the header doesn't need it. */
export const getCheckout = cache(() => fetchCart(CART_FIELDS + CHECKOUT_FIELDS));

async function fetchCart(fields) {
  const token = await getToken();
  if (token) {
    try {
      return (await gql(`{ customerCart { ${fields} } }`, {}, { token })).customerCart;
    } catch (e) {
      if (!isAuthError(e)) throw e;
    }
  }
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  try {
    return (await gql(`query ($id: String!) { cart(cart_id: $id) { ${fields} } }`, { id }, { noStore: true })).cart;
  } catch (e) {
    if (isGone(e)) return null;
    throw e;
  }
}

async function newGuestCart() {
  const { createGuestCart } = await gql(`mutation { createGuestCart { cart { id } } }`, {}, { noStore: true });
  (await cookies()).set(COOKIE, createGuestCart.cart.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 3600, // Magento's default quote lifetime
  });
  return createGuestCart.cart.id;
}

const ADD = `mutation ($id: String!, $items: [CartItemInput!]!) {
  addProductsToCart(cartId: $id, cartItems: $items) { user_errors { code message } }
}`;

/** @returns {Promise<{ code: string, message: string }[]>} Magento's per-item user_errors (partial adds still succeed). */
export async function addItems(items) {
  const { id, token } = await owner();
  const add = async (cartId) => (await gql(ADD, { id: cartId, items }, { token, noStore: true })).addProductsToCart.user_errors;
  if (token) return add(id);
  try {
    return await add(id ?? (await newGuestCart()));
  } catch (e) {
    // Stale cookie (cart expired or already ordered): start a fresh cart once.
    if (id && isGone(e)) return add(await newGuestCart());
    throw e;
  }
}

/** Runs a mutation on the current cart; the query receives the cart id as `$id`. */
export async function cartMutation(query, variables = {}) {
  const { id, token } = await owner();
  if (!id) throw new MagentoError("No cart", "graphql-no-such-entity");
  return gql(query, { ...variables, id }, { token, noStore: true });
}

/** quantity 0 removes the line. */
export async function updateItem(uid, quantity) {
  await (quantity === 0
    ? cartMutation(`mutation ($id: String!, $uid: ID!) { removeItemFromCart(input: { cart_id: $id, cart_item_uid: $uid }) { cart { total_quantity } } }`, { uid })
    : cartMutation(
        `mutation ($id: String!, $uid: ID!, $qty: Float!) { updateCartItems(input: { cart_id: $id, cart_items: [{ cart_item_uid: $uid, quantity: $qty }] }) { cart { total_quantity } } }`,
        { uid, qty: quantity },
      ));
}

/** After placing an order the guest cart is inactive; drop its cookie (customers get a fresh customerCart from Magento). */
export async function forgetGuestCart() {
  (await cookies()).delete(COOKIE);
}

/** On login/registration: fold the guest cart into the customer's cart. Best effort; the guest cookie goes regardless. */
export async function mergeGuestCart(token) {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return;
  await gql(`mutation ($id: String!) { mergeCarts(source_cart_id: $id) { id } }`, { id }, { token, noStore: true }).catch((e) =>
    console.error("Cart merge failed:", e.category),
  );
  jar.delete(COOKIE);
}
