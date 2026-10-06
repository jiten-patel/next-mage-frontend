import "server-only";
import { cache } from "react";
import { gql } from "./magento";
import { customerQuery, getToken, isAuthError } from "./auth";

/**
 * @typedef {{ value: number, currency: string }} Money
 * @typedef {{ sku: string, stock_status: string, small_image: { url: string, label: string }|null,
 *   price_range: { minimum_price: { final_price: Money } } }} WishlistProduct
 * @typedef {{ id: string, added_at: string, product: WishlistProduct & { __typename: string, name: string, url_key: string },
 *   configurable_options?: { option_label: string, value_label: string }[], configured_variant?: WishlistProduct|null }} WishlistItem
 * @typedef {{ id: string, items: WishlistItem[] }} Wishlist
 */

const PRODUCT = "sku stock_status small_image { url label } price_range { minimum_price { final_price { value currency } } }";
// Magento Open Source: one wishlist per customer, created with the account.
// ponytail: first 100 items; paginate items_v2 if wishlists grow that big.
const WISHLIST = `{
  customer {
    wishlists {
      id
      items_v2(pageSize: 100) {
        items {
          id added_at
          product { __typename name url_key ${PRODUCT} }
          ... on ConfigurableWishlistItem { configurable_options { option_label value_label } configured_variant { ${PRODUCT} } }
        }
      }
    }
  }
}`;

const toWishlist = ({ customer }) => {
  const [w] = customer.wishlists;
  return { id: w.id, items: w.items_v2.items };
};

/** For session-aware UI (header badge, product page heart): the wishlist, or null for guests/expired sessions. @returns {Promise<Wishlist|null>} */
export const getWishlist = cache(async () => {
  const token = await getToken();
  if (!token) return null;
  try {
    return toWishlist(await gql(WISHLIST, {}, { token }));
  } catch (e) {
    if (isAuthError(e)) return null;
    throw e;
  }
});

/** For the protected wishlist page: no/expired session redirects like every other account page. @returns {Promise<Wishlist>} */
export async function requireWishlist() {
  // Reuse the header's cached request: Magento creates a new customer's wishlist on first read, and two
  // parallel reads both try to insert it (duplicate key → "Internal server error").
  // null means no/expired session; customerQuery then performs the matching redirect.
  return (await getWishlist()) ?? toWishlist(await customerQuery(WISHLIST));
}

/** Can Magento move this item straight to the cart? Configurables need the variant saved with the item. */
export const canMoveToCart = (item) =>
  ["SimpleProduct", "VirtualProduct"].includes(item.product.__typename) ||
  (item.product.__typename === "ConfigurableProduct" && !!item.configured_variant);
