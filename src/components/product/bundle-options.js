import { formatPrice } from "@/lib/format";
import { priceOf } from "./price";

const byPosition = (a, b) => a.position - b.position;

// Dynamic bundles cost the sum of the chosen products; fixed bundles add each option's own price.
// ponytail: fixed bundles show Magento's "From" price (GraphQL exposes no base price to add options to).
function optionPrice(product, option) {
  return product.dynamic_price ? option.product.price_range.minimum_price.final_price.value : option.price;
}

// Selection: { [item uid]: { [option uid]: qty } }
export function initial(product) {
  return Object.fromEntries(
    product.items.map((item) => [
      item.uid,
      Object.fromEntries(item.options.filter((o) => o.is_default).map((o) => [o.uid, o.quantity || 1])),
    ]),
  );
}

export function resolve(product, selection) {
  const inStock = product.stock_status === "IN_STOCK";
  const complete = product.items.every((i) => !i.required || Object.keys(selection[i.uid] ?? {}).length);

  if (!product.dynamic_price) {
    return { price: { ...priceOf(product.price_range.minimum_price), label: "From" }, inStock, canAdd: inStock && complete };
  }

  const total = product.items.reduce(
    (sum, item) =>
      sum +
      item.options.reduce((s, o) => s + (selection[item.uid]?.[o.uid] ? optionPrice(product, o) * selection[item.uid][o.uid] : 0), 0),
    0,
  );
  return { price: { value: total, label: "Total" }, inStock, canAdd: inStock && complete };
}

// Option uids are base64("bundle/{option}/{selection}/{qty}"); a changed quantity is re-encoded into the uid.
const withQty = (uid, qty) => btoa(atob(uid).replace(/[^/]*$/, String(qty)));

export function cartItems(product, selection, qty) {
  const selected_options = Object.values(selection).flatMap((chosen) => Object.entries(chosen).map(([uid, q]) => withQty(uid, q)));
  return [{ sku: product.sku, quantity: qty, selected_options }];
}

export default function BundleOptions({ product, selection, onChange }) {
  const currency = product.price_range.minimum_price.final_price.currency;
  const { minimum_price, maximum_price } = product.price_range;
  const setItem = (uid, chosen) => onChange({ ...selection, [uid]: chosen });

  const optionLabel = (o) =>
    `${o.quantity > 1 && !o.can_change_quantity ? `${o.quantity} × ` : ""}${o.label} +${formatPrice({ value: optionPrice(product, o), currency })}`;

  return (
    <div className="mb-5">
      <p className="mb-4 text-sm text-muted">
        Price range: {formatPrice(minimum_price.final_price)} – {formatPrice(maximum_price.final_price)}
      </p>

      {[...product.items].sort(byPosition).map((item) => {
        const chosen = selection[item.uid] ?? {};
        const single = item.type === "radio" || item.type === "select";
        const selectedOption = single && item.options.find((o) => chosen[o.uid]);
        const pickOne = (uid) => {
          const option = item.options.find((o) => o.uid === uid);
          setItem(item.uid, option ? { [uid]: option.quantity || 1 } : {});
        };
        const toggle = (o) => {
          const { [o.uid]: removed, ...rest } = chosen;
          setItem(item.uid, removed ? rest : { ...chosen, [o.uid]: o.quantity || 1 });
        };

        return (
          <fieldset key={item.uid} className="mb-5">
            <legend className="mb-2 font-semibold">
              {item.title} {item.required && <span className="text-red-600">*</span>}
            </legend>

            {item.type === "radio" && (
              <div className="grid gap-1">
                {!item.required && (
                  <label className="flex items-center gap-2">
                    <input type="radio" name={item.uid} checked={!selectedOption} onChange={() => pickOne(null)} />
                    None
                  </label>
                )}
                {item.options.map((o) => (
                  <label key={o.uid} className="flex items-center gap-2">
                    <input type="radio" name={item.uid} checked={!!chosen[o.uid]} onChange={() => pickOne(o.uid)} />
                    {optionLabel(o)}
                  </label>
                ))}
              </div>
            )}

            {item.type === "select" && (
              <select
                value={selectedOption?.uid ?? ""}
                onChange={(e) => pickOne(e.target.value || null)}
                className="w-full rounded-md border border-line p-2"
              >
                <option value="">Choose a selection…</option>
                {item.options.map((o) => <option key={o.uid} value={o.uid}>{optionLabel(o)}</option>)}
              </select>
            )}

            {item.type === "checkbox" && (
              <div className="grid gap-1">
                {item.options.map((o) => (
                  <label key={o.uid} className="flex items-center gap-2">
                    <input type="checkbox" checked={!!chosen[o.uid]} onChange={() => toggle(o)} />
                    {optionLabel(o)}
                  </label>
                ))}
              </div>
            )}

            {item.type === "multi" && (
              <select
                multiple
                value={Object.keys(chosen)}
                onChange={(e) =>
                  setItem(
                    item.uid,
                    Object.fromEntries(
                      [...e.target.selectedOptions].map(({ value }) => [value, item.options.find((o) => o.uid === value).quantity || 1]),
                    ),
                  )
                }
                className="w-full rounded-md border border-line p-2"
              >
                {item.options.map((o) => <option key={o.uid} value={o.uid}>{optionLabel(o)}</option>)}
              </select>
            )}

            {/* Magento only allows changing quantity on single-choice items. */}
            {selectedOption?.can_change_quantity && (
              <label className="mt-2 flex items-center gap-2 text-sm">
                Qty
                <input
                  type="number"
                  min={1}
                  value={chosen[selectedOption.uid]}
                  onChange={(e) => setItem(item.uid, { [selectedOption.uid]: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-20 rounded-md border border-line p-1.5"
                />
              </label>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
