import Link from "next/link";
import { getCart } from "@/lib/cart";
import { CartLine, CartTotals, CouponForm } from "@/components/cart-lines";
import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  // Magento down → app/error.js shows the friendly "try again" page.
  const cart = await getCart();
  const items = cart?.itemsV2.items ?? [];

  return (
    <section className="container py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Shopping cart" }]} />
      <h1 className="mb-6 text-2xl font-semibold text-black md:text-[2rem]">Shopping cart</h1>

      {items.length ? (
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => <CartLine key={item.uid} item={item} editable />)}
          </ul>
          <aside className="h-fit space-y-4 rounded-md bg-surface p-5">
            <h2 className="text-lg font-semibold text-black">Order summary</h2>
            <CouponForm coupons={cart.applied_coupons} />
            <div className="border-t border-line pt-4">
              <CartTotals prices={cart.prices} shipping={cart.shipping_addresses?.[0]?.selected_shipping_method} />
            </div>
            <Link href="/checkout" className="block rounded-full bg-black py-3 text-center text-sm font-semibold text-white hover:bg-ink">Proceed to checkout</Link>
          </aside>
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="mb-6 text-muted">Your cart is empty.</p>
          <Link href="/" className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink">Continue shopping</Link>
        </div>
      )}
    </section>
  );
}
