"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { moveToCart, removeFromWishlist } from "@/lib/wishlist-actions";
import { OPEN_EVENT } from "./mini-cart";
import { Spinner } from "./icon";

export default function WishlistItemActions({ itemId, href, canMove, inStock }) {
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);
  const [, startTransition] = useTransition();

  const run = (kind, action) =>
    startTransition(async () => {
      setPending(kind);
      const result = await action();
      setPending(null);
      setError(result?.error ?? null);
      // The action re-renders the header, so the mini-cart already holds the moved line.
      if (kind === "cart" && !result?.error) window.dispatchEvent(new Event(OPEN_EVENT));
    });

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {canMove ? (
          <button
            type="button"
            onClick={() => run("cart", () => moveToCart(itemId))}
            disabled={!!pending || !inStock}
            aria-busy={pending === "cart"}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending === "cart" && <Spinner />}
            {pending === "cart" ? "Adding…" : inStock ? "Add to cart" : "Out of stock"}
          </button>
        ) : (
          // Saved without a variant (or a type needing choices): Magento can't add it without options.
          <Link href={href} className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-ink">Choose options</Link>
        )}
        <button
          type="button"
          onClick={() => run("remove", () => removeFromWishlist([itemId]))}
          disabled={!!pending}
          aria-busy={pending === "remove"}
          className="text-sm font-semibold text-black underline underline-offset-4 disabled:opacity-50"
        >
          {pending === "remove" ? "Removing…" : "Remove"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
