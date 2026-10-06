"use server";

import { revalidatePath } from "next/cache";
import { MagentoError } from "./magento";
import { friendlyError } from "./auth";
import { addItems, cartMutation, updateItem } from "./cart";
import { field } from "./validate";

const MAX_QTY = 10000;
const isQty = (n) => Number.isInteger(n) && n >= 1 && n <= MAX_QTY;

// Any revalidatePath makes Next re-render the current page in the action response, so the header's
// mini-cart and the /cart page both pick up the change without a client-side refetch.
const refresh = () => revalidatePath("/cart");

/** @param {{ sku: string, quantity: number, selected_options?: string[] }[]} items @returns {Promise<{ error?: string }>} */
export async function addToCart(items) {
  // Called from the browser with arbitrary input: keep only well-formed fields.
  const clean = Array.isArray(items)
    ? items.filter((i) => typeof i?.sku === "string" && i.sku && isQty(i.quantity)).map((i) => ({
        sku: i.sku,
        quantity: i.quantity,
        selected_options: Array.isArray(i.selected_options) ? i.selected_options.filter((o) => typeof o === "string") : [],
      }))
    : [];
  if (!clean.length || clean.length > 50) return { error: "Please choose a product and quantity." };

  try {
    const userErrors = await addItems(clean);
    refresh();
    // Magento still adds the valid lines when some fail (e.g. a grouped product with one item out of stock).
    if (userErrors.length) return { error: friendlyError(new MagentoError(userErrors[0].message, "graphql-input"), "We couldn't add this item to your cart.") };
    return {};
  } catch (e) {
    return { error: friendlyError(e, "We couldn't add this item to your cart.") };
  }
}

/** Form action for a cart line: Update (quantity field) or Remove (remove button). */
export async function updateCartItem(_prev, formData) {
  const uid = String(formData.get("uid") ?? "");
  const remove = !!formData.get("remove");
  const quantity = remove ? 0 : Number(formData.get("quantity"));
  if (!uid || (!remove && !isQty(quantity))) return { error: `Enter a quantity between 1 and ${MAX_QTY}.` };

  try {
    await updateItem(uid, quantity);
  } catch (e) {
    return { error: friendlyError(e, "We couldn't update your cart. Please try again.") };
  }
  refresh();
  return {};
}

const COUPON_FIELD = "coupon_code";

export async function applyCoupon(_prev, formData) {
  const code = field(formData, COUPON_FIELD);
  const values = { [COUPON_FIELD]: code };
  if (!code) return { fieldErrors: { [COUPON_FIELD]: "Enter a coupon code." }, values };
  try {
    await cartMutation(`mutation ($id: String!, $code: String!) { applyCouponToCart(input: { cart_id: $id, coupon_code: $code }) { cart { total_quantity } } }`, { code });
  } catch (e) {
    // Unknown/expired/not-applicable codes all come back as no-such-entity.
    if (e instanceof MagentoError && e.category === "graphql-no-such-entity" && /coupon/i.test(e.message)) {
      return { fieldErrors: { [COUPON_FIELD]: "This coupon code isn't valid for your cart." }, values };
    }
    return { error: friendlyError(e, "We couldn't apply this coupon. Please try again."), values };
  }
  refresh();
  return {};
}

export async function removeCoupon() {
  try {
    await cartMutation(`mutation ($id: String!) { removeCouponFromCart(input: { cart_id: $id }) { cart { total_quantity } } }`);
  } catch (e) {
    return { error: friendlyError(e, "We couldn't remove this coupon. Please try again.") };
  }
  refresh();
  return {};
}
