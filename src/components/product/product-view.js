"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/lib/cart-actions";
import { addToWishlist, removeFromWishlist } from "@/lib/wishlist-actions";
import { OPEN_EVENT } from "../mini-cart";
import Icon, { Spinner } from "../icon";
import Gallery from "./gallery";
import Price, { priceOf } from "./price";
import * as configurable from "./configurable-options";
import * as bundle from "./bundle-options";
import * as grouped from "./grouped-items";
import * as downloadable from "./downloadable-links";

// Simple and virtual products have nothing to choose.
const plain = {
  initial: () => null,
  resolve: (product) => {
    const inStock = product.stock_status === "IN_STOCK";
    return { price: priceOf(product.price_range.minimum_price), inStock, canAdd: inStock };
  },
  default: () => null,
  cartItems: (product, _selection, qty) => [{ sku: product.sku, quantity: qty }],
};

const TYPES = {
  ConfigurableProduct: configurable,
  BundleProduct: bundle,
  GroupedProduct: grouped,
  DownloadableProduct: downloadable,
};

export default function ProductView({ product, wishlistItemIds = [] }) {
  const type = TYPES[product.__typename] ?? plain;
  const Options = type.default;
  const [selection, setSelection] = useState(() => type.initial(product));
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(null);
  const [adding, startAdding] = useTransition();
  const [saving, startSaving] = useTransition();
  const saved = wishlistItemIds.length > 0;

  const add = () =>
    startAdding(async () => {
      const result = await addToCart(type.cartItems(product, selection, qty));
      setError(result.error ?? null);
      // The action re-renders the header, so the mini-cart already holds the new line.
      if (!result.error) window.dispatchEvent(new Event(OPEN_EVENT));
    });

  const { images = product.media_gallery, price, inStock, canAdd } = type.resolve(product, selection);

  // A fully chosen variant is saved with its options so it can go straight to the cart from the wishlist;
  // otherwise the product itself is saved. Guests are redirected to log in by the action.
  const toggleWishlist = () =>
    startSaving(async () => {
      const item = product.__typename === "ConfigurableProduct" && canAdd ? configurable.cartItems(product, selection, 1)[0] : { sku: product.sku };
      const result = await (saved ? removeFromWishlist(wishlistItemIds) : addToWishlist(item));
      setError(result?.error ?? null);
    });
  const currency = product.price_range.minimum_price.final_price.currency;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Gallery key={images[0]?.url} images={images} alt={product.name} />

      <div>
        <h1 className="mb-2 text-3xl md:text-4xl">{product.name}</h1>
        <p className="mb-4 text-sm text-subtle">SKU: {product.sku}</p>
        <Price {...price} currency={currency} />
        <p className={`mb-5 text-sm font-semibold ${inStock ? "text-green-700" : "text-red-600"}`}>
          {inStock ? "In stock" : "Out of stock"}
        </p>

        {product.short_description?.html && (
          <div className="mb-5 text-muted" dangerouslySetInnerHTML={{ __html: product.short_description.html }} />
        )}

        <Options product={product} selection={selection} onChange={setSelection} />

        <div className="flex flex-wrap items-center gap-4">
          {/* Grouped products take a quantity per item instead. */}
          {product.__typename !== "GroupedProduct" && (
            <label className="flex items-center gap-2">
              Qty
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-md border border-line p-2"
              />
            </label>
          )}
          <button
            type="button"
            onClick={add}
            disabled={!canAdd || adding}
            aria-busy={adding}
            // Busy looks busy (spinner, wait cursor), not unavailable like an out-of-stock/incomplete selection.
            className={`inline-flex items-center gap-2 rounded-[10px] border border-black bg-black px-8 py-3 font-semibold text-white ${adding ? "cursor-wait opacity-80" : "disabled:cursor-not-allowed disabled:opacity-40"}`}
          >
            {adding && <Spinner />}
            {adding ? "Adding…" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={saving}
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            aria-busy={saving}
            className={`inline-flex items-center gap-2 rounded-[10px] border border-black px-5 py-3 font-semibold text-black hover:bg-surface ${saving ? "cursor-wait opacity-80" : ""}`}
          >
            {saving ? <Spinner /> : <Icon name="heart" className={`size-5 ${saved ? "fill-current" : ""}`} />}
            {saved ? "Saved" : "Wishlist"}
          </button>
        </div>
        {error && <p role="alert" className="mt-3 animate-fade-in text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
