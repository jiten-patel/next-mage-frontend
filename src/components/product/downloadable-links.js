import { formatPrice } from "@/lib/format";
import { priceOf } from "./price";

const bySortOrder = (a, b) => a.sort_order - b.sort_order;

// Selection: [link uid, ...]. Only used when links are purchased separately; otherwise every link is included.
export const initial = () => [];

export function resolve(product, selection) {
  const inStock = product.stock_status === "IN_STOCK";
  const base = priceOf(product.price_range.minimum_price);
  if (!product.links_purchased_separately) return { price: base, inStock, canAdd: inStock };

  const extra = product.downloadable_product_links
    .filter((l) => selection.includes(l.uid))
    .reduce((sum, l) => sum + l.price, 0);
  return { price: { value: base.value + extra }, inStock, canAdd: inStock && selection.length > 0 };
}

export function cartItems(product, selection, qty) {
  return [{ sku: product.sku, quantity: qty, selected_options: selection }];
}

function SampleLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm underline">
      {children}
    </a>
  );
}

export default function DownloadableLinks({ product, selection, onChange }) {
  const currency = product.price_range.minimum_price.final_price.currency;
  const links = [...(product.downloadable_product_links ?? [])].sort(bySortOrder);
  const samples = [...(product.downloadable_product_samples ?? [])].sort(bySortOrder);
  const separate = product.links_purchased_separately;
  const toggle = (uid) => onChange(selection.includes(uid) ? selection.filter((u) => u !== uid) : [...selection, uid]);

  return (
    <div className="mb-5">
      {links.length > 0 && (
        <fieldset className="mb-4">
          <legend className="mb-2 font-semibold">
            {product.links_title || "Links"} {separate && <span className="text-red-600">*</span>}
          </legend>
          <ul className="grid gap-1">
            {links.map((link) => (
              <li key={link.uid} className="flex flex-wrap items-center gap-2">
                {separate ? (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={selection.includes(link.uid)} onChange={() => toggle(link.uid)} />
                    {link.title}
                    {link.price > 0 && <span className="text-subtle">+{formatPrice({ value: link.price, currency })}</span>}
                  </label>
                ) : (
                  <span>{link.title}</span>
                )}
                {link.sample_url && <SampleLink href={link.sample_url}>Sample</SampleLink>}
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      {samples.length > 0 && (
        <div>
          <p className="mb-2 font-semibold">Samples</p>
          <ul className="grid gap-1">
            {samples.map((s) => (
              <li key={s.title}><SampleLink href={s.sample_url}>{s.title}</SampleLink></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
