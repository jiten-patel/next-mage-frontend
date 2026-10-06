"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MagentoError } from "./magento";
import { customerQuery, friendlyError, getToken } from "./auth";

// Any revalidatePath re-renders the current page in the action response (header badge, heart, list).
const refresh = () => revalidatePath("/account/wishlist");

async function wishlistId() {
  const { customer } = await customerQuery(`{ customer { wishlists { id } } }`);
  return customer.wishlists[0].id;
}

// Magento wishlists belong to customers; guests are sent to log in first.
async function requireLogin() {
  if (!(await getToken())) redirect("/login?wishlist=1");
}

const isIds = (ids) => Array.isArray(ids) && ids.length > 0 && ids.length <= 100 && ids.every((id) => typeof id === "string" && /^\d+$/.test(id));

/** @param {{ sku: string, selected_options?: string[] }} item @returns {Promise<{ error?: string }>} */
export async function addToWishlist(item) {
  await requireLogin();
  // Called from the browser with arbitrary input: keep only well-formed fields.
  if (typeof item?.sku !== "string" || !item.sku) return { error: "Please choose a product." };
  const input = {
    sku: item.sku,
    quantity: 1,
    selected_options: Array.isArray(item.selected_options) ? item.selected_options.filter((o) => typeof o === "string") : [],
  };

  try {
    const { addProductsToWishlist } = await customerQuery(
      `mutation ($id: ID!, $items: [WishlistItemInput!]!) { addProductsToWishlist(wishlistId: $id, wishlistItems: $items) { user_errors { message } } }`,
      { id: await wishlistId(), items: [input] },
    );
    const [userError] = addProductsToWishlist.user_errors;
    if (userError) return { error: friendlyError(new MagentoError(userError.message, "graphql-input"), "We couldn't save this item.") };
  } catch (e) {
    return { error: friendlyError(e, "We couldn't save this item to your wishlist. Please try again.") };
  }
  refresh();
  return {};
}

/** @param {string[]} itemIds @returns {Promise<{ error?: string }>} */
export async function removeFromWishlist(itemIds) {
  await requireLogin();
  if (!isIds(itemIds)) return { error: "Please choose an item." };
  try {
    await customerQuery(
      `mutation ($id: ID!, $items: [ID!]!) { removeProductsFromWishlist(wishlistId: $id, wishlistItemsIds: $items) { wishlist { id } } }`,
      { id: await wishlistId(), items: itemIds },
    );
  } catch (e) {
    return { error: friendlyError(e, "We couldn't remove this item. Please try again.") };
  }
  refresh();
  return {};
}

/** Magento adds the item to the customer's cart and drops it from the wishlist. @returns {Promise<{ error?: string }>} */
export async function moveToCart(itemId) {
  await requireLogin();
  if (!isIds([itemId])) return { error: "Please choose an item." };
  try {
    const { addWishlistItemsToCart: result } = await customerQuery(
      `mutation ($id: ID!, $items: [ID!]) { addWishlistItemsToCart(wishlistId: $id, wishlistItemIds: $items) { status add_wishlist_items_to_cart_user_errors { message } } }`,
      { id: await wishlistId(), items: [itemId] },
    );
    const [userError] = result.add_wishlist_items_to_cart_user_errors;
    const fallback = "We couldn't add this item to your cart.";
    if (!result.status || userError) {
      return { error: userError?.message ? friendlyError(new MagentoError(userError.message, "graphql-input"), fallback) : fallback };
    }
  } catch (e) {
    return { error: friendlyError(e, "We couldn't add this item to your cart. Please try again.") };
  }
  revalidatePath("/cart"); // header mini-cart
  refresh();
  return {};
}
