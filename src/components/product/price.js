import { formatPrice } from "@/lib/format";

// { value, regular } from a Magento price_range.minimum_price.
export function priceOf({ final_price, regular_price }) {
  return { value: final_price.value, regular: regular_price?.value };
}

export default function Price({ value, regular, label, currency }) {
  return (
    <p className="mb-4 flex items-baseline gap-2">
      {label && <span className="text-muted">{label}</span>}
      <span className="text-3xl font-semibold text-black">{formatPrice({ value, currency })}</span>
      {regular > value && (
        <s className="text-lg text-subtle">{formatPrice({ value: regular, currency })}</s>
      )}
    </p>
  );
}
