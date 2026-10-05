import Image from "next/image";
import { formatPrice } from "@/lib/format";

const unitPrice = (item) => item.product.price_range.minimum_price.final_price;
const inStock = (item) => item.product.stock_status === "IN_STOCK";

// Selection: { [child sku]: qty }
export function initial(product) {
  return Object.fromEntries(product.items.map((i) => [i.product.sku, inStock(i) ? i.qty : 0]));
}

export function resolve(product, selection) {
  const total = product.items.reduce((sum, i) => sum + unitPrice(i).value * (selection[i.product.sku] || 0), 0);
  const inStockAny = product.items.some(inStock);
  return {
    price: { value: total, label: "Total" },
    inStock: inStockAny,
    canAdd: inStockAny && Object.values(selection).some((qty) => qty > 0),
  };
}

export default function GroupedItems({ product, selection, onChange }) {
  return (
    <ul className="mb-5 divide-y divide-line border-y border-line">
      {[...product.items]
        .sort((a, b) => a.position - b.position)
        .map((item) => {
          const { sku, name, small_image } = item.product;
          return (
            <li key={sku} className="flex items-center gap-4 py-3">
              {small_image?.url && (
                <Image src={small_image.url} alt={small_image.label || name} width={64} height={64} className="rounded-md" />
              )}
              <div className="flex-1">
                <p className="font-medium text-black">{name}</p>
                <p className="text-subtle">{formatPrice(unitPrice(item))}</p>
              </div>
              {inStock(item) ? (
                <input
                  type="number"
                  min={0}
                  aria-label={`Quantity of ${name}`}
                  value={selection[sku]}
                  onChange={(e) => onChange({ ...selection, [sku]: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-20 rounded-md border border-line p-1.5"
                />
              ) : (
                <span className="text-sm text-red-600">Out of stock</span>
              )}
            </li>
          );
        })}
    </ul>
  );
}
