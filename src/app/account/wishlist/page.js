import Image from "next/image";
import Link from "next/link";
import { canMoveToCart, requireWishlist } from "@/lib/wishlist";
import { formatPrice } from "@/lib/format";
import WishlistItemActions from "@/components/wishlist-item-actions";
import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const { items } = await requireWishlist();

  return (
    <>
      <Breadcrumbs items={[{ label: "My account", href: "/account" }, { label: "Wishlist" }]} />
      <h1 className="mb-6 text-2xl font-semibold text-black md:text-[2rem]">Wishlist</h1>
      {!items.length ? (
        <p className="text-sm text-muted">
          Your wishlist is empty. Tap the heart on any product to save it here.{" "}
          <Link href="/" className="font-semibold text-black underline underline-offset-4">Continue shopping</Link>
        </p>
      ) : (
        <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            // The saved variant (if any) has its own image, price and stock.
            const shown = item.configured_variant ?? item.product;
            const image = shown.small_image ?? item.product.small_image;
            const href = `/product/${item.product.url_key}`;
            return (
              <li key={item.id}>
                <Link href={href} className="group block">
                  <div className="relative aspect-square overflow-hidden bg-card">
                    {image && (
                      <Image src={image.url} alt={image.label || item.product.name} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 40vw, 100vw" className="object-contain p-4 transition duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-2 pt-3">
                    <span className="text-sm font-semibold text-black">{item.product.name}</span>
                    <span className="shrink-0 text-xs text-ink">{formatPrice(shown.price_range.minimum_price.final_price)}</span>
                  </div>
                </Link>
                {item.configurable_options?.map((o) => (
                  <p key={o.option_label} className="text-xs text-muted">{o.option_label}: {o.value_label}</p>
                ))}
                <WishlistItemActions itemId={item.id} href={href} canMove={canMoveToCart(item)} inStock={shown.stock_status === "IN_STOCK"} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
