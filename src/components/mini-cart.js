"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CartLine, CartTotals } from "./cart-lines";
import Icon from "./icon";

export const OPEN_EVENT = "minicart:open";

// Native modal <dialog>: focus trap, Esc to close and the backdrop come free. Opened by the cart icon
// or by Add to cart (OPEN_EVENT). Without JS the icon is still a plain link to /cart.
export default function MiniCart({ cart }) {
  const dialog = useRef(null);
  const items = cart?.itemsV2.items ?? [];
  const count = cart?.total_quantity ?? 0;

  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const close = () => dialog.current?.close();

  return (
    <>
      <Link
        href="/cart"
        onClick={(e) => { e.preventDefault(); dialog.current?.showModal(); }}
        aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
        className="relative"
      >
        <Icon name="cart" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-black px-1 text-[10px] font-semibold leading-4 text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>

      {/* Backdrop clicks land on the <dialog> itself; links inside navigate away, so close for both. */}
      <dialog
        ref={dialog}
        aria-labelledby="minicart-title"
        onClick={(e) => (e.target === e.currentTarget || e.target.closest("a")) && close()}
        className="drawer m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-white p-0 text-ink"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="minicart-title" className="text-lg font-semibold text-black">Your cart ({count})</h2>
            <button type="button" onClick={close} aria-label="Close cart"><Icon name="close" /></button>
          </div>

          {items.length ? (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                {items.map((item) => <CartLine key={item.uid} item={item} />)}
              </ul>
              <div className="border-t border-line px-5 py-4">
                <CartTotals prices={cart.prices} shipping={cart.shipping_addresses?.[0]?.selected_shipping_method} />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link href="/cart" className="rounded-full border border-black py-2.5 text-center text-sm font-semibold text-black hover:bg-surface">View cart</Link>
                  <Link href="/checkout" className="rounded-full bg-black py-2.5 text-center text-sm font-semibold text-white hover:bg-ink">Checkout</Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
              <p className="text-muted">Your cart is empty.</p>
              <button type="button" onClick={close} className="text-sm font-semibold text-black underline underline-offset-4">
                Continue shopping
              </button>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
