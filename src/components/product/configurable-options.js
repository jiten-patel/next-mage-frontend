import { priceOf } from "./price";

const inStock = (v) => v.product.stock_status === "IN_STOCK";

// Does the variant agree with every chosen value (optionally ignoring one attribute)?
function matches(variant, selection, ignoreCode) {
  return variant.attributes.every(
    (a) => a.code === ignoreCode || !selection[a.code] || selection[a.code] === a.uid,
  );
}

// Selection: { [attribute_code]: value uid }
export const initial = () => ({});

export function resolve(product, selection) {
  const candidates = product.variants.filter((v) => matches(v, selection));
  const complete = product.configurable_options.every((o) => selection[o.attribute_code]);
  const variant = complete ? candidates[0] : null;
  const preview = candidates[0]?.product; // e.g. colour chosen, size not yet: still show that colour
  const { minimum_price, maximum_price } = product.price_range;

  return {
    images: preview?.media_gallery?.length ? preview.media_gallery : product.media_gallery,
    price: variant
      ? priceOf(variant.product.price_range.minimum_price)
      : {
          ...priceOf(minimum_price),
          label: maximum_price.final_price.value > minimum_price.final_price.value ? "From" : undefined,
        },
    inStock: variant ? inStock(variant) : product.stock_status === "IN_STOCK",
    canAdd: !!variant && inStock(variant),
  };
}

// Magento takes the parent SKU plus the chosen value uids and resolves the variant itself.
export function cartItems(product, selection, qty) {
  return [{ sku: product.sku, quantity: qty, selected_options: Object.values(selection).filter(Boolean) }];
}

function swatchClasses(type, selected, disabled) {
  const state = `${selected ? "ring-2 ring-black ring-offset-2" : ""} ${disabled ? "cursor-not-allowed opacity-30" : ""}`;
  if (type === "ColorSwatchData" || type === "ImageSwatchData") {
    return `size-9 rounded-full border border-line bg-cover bg-center ${state}`;
  }
  return `min-w-12 rounded-md border px-3 py-1.5 ${selected ? "border-black bg-black text-white" : "border-line"} ${disabled ? "cursor-not-allowed line-through opacity-40" : ""}`;
}

export default function ConfigurableOptions({ product, selection, onChange }) {
  const isAvailable = (code, uid) =>
    product.variants.some(
      (v) => inStock(v) && v.attributes.some((a) => a.code === code && a.uid === uid) && matches(v, selection, code),
    );

  return [...product.configurable_options]
    .sort((a, b) => a.position - b.position)
    .map(({ uid, attribute_code: code, label, values }) => (
      <fieldset key={uid} className="mb-5">
        <legend className="mb-2 font-semibold">
          {label}
          {selection[code] && (
            <span className="font-normal">: {values.find((v) => v.uid === selection[code])?.label}</span>
          )}
        </legend>
        <div className="flex flex-wrap gap-3">
          {values.map((value) => {
            const selected = selection[code] === value.uid;
            const disabled = !isAvailable(code, value.uid);
            const swatch = value.swatch_data;
            const style =
              swatch?.__typename === "ColorSwatchData"
                ? { backgroundColor: swatch.value }
                : swatch?.__typename === "ImageSwatchData"
                  ? { backgroundImage: `url(${swatch.thumbnail})` }
                  : undefined;

            return (
              <button
                key={value.uid}
                type="button"
                title={value.label}
                aria-label={value.label}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onChange({ ...selection, [code]: selected ? undefined : value.uid })}
                className={swatchClasses(swatch?.__typename, selected, disabled)}
                style={style}
              >
                {style ? null : value.label}
              </button>
            );
          })}
        </div>
      </fieldset>
    ));
}
