import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

// Presentational tile: grey square image, name left, price right. `href` optional (static showcase tiles).
export function Card({ href, image, alt, name, price }) {
  return (
    <div className="group relative text-left">
      <div className="relative aspect-square overflow-hidden bg-card">
        <Image
          src={image}
          alt={alt || name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-4 transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex items-baseline justify-between gap-2 pt-3">
        {href ? (
          <Link href={href} className="text-sm font-semibold text-black after:absolute after:inset-0">{name}</Link>
        ) : (
          <span className="text-sm font-semibold text-black">{name}</span>
        )}
        <span className="shrink-0 text-xs text-ink">{formatPrice(price)}</span>
      </div>
    </div>
  );
}

export default function ProductCard({ product }) {
  const { name, url_key, small_image, price_range } = product;

  return (
    <Card
      href={`/product/${url_key}`}
      image={small_image.url}
      alt={small_image.label}
      name={name}
      price={price_range.minimum_price.final_price}
    />
  );
}
