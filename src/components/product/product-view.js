"use client";

import { useState } from "react";
import Gallery from "./gallery";
import Price, { priceOf } from "./price";
import * as configurable from "./configurable-options";
import * as bundle from "./bundle-options";
import * as grouped from "./grouped-items";
import * as downloadable from "./downloadable-links";

// Simple and virtual products have nothing to choose.
const plain = {
  initial: () => null,
  resolve: (product) => {
    const inStock = product.stock_status === "IN_STOCK";
    return { price: priceOf(product.price_range.minimum_price), inStock, canAdd: inStock };
  },
  default: () => null,
};

const TYPES = {
  ConfigurableProduct: configurable,
  BundleProduct: bundle,
  GroupedProduct: grouped,
  DownloadableProduct: downloadable,
};

export default function ProductView({ product }) {
  const type = TYPES[product.__typename] ?? plain;
  const Options = type.default;
  const [selection, setSelection] = useState(() => type.initial(product));
  const [qty, setQty] = useState(1);

  const { images = product.media_gallery, price, inStock, canAdd } = type.resolve(product, selection);
  const currency = product.price_range.minimum_price.final_price.currency;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Gallery key={images[0]?.url} images={images} alt={product.name} />

      <div>
        <h1 className="mb-2 text-3xl md:text-4xl">{product.name}</h1>
        <p className="mb-4 text-sm text-subtle">SKU: {product.sku}</p>
        <Price {...price} currency={currency} />
        <p className={`mb-5 text-sm font-semibold ${inStock ? "text-green-700" : "text-red-600"}`}>
          {inStock ? "In stock" : "Out of stock"}
        </p>

        {product.short_description?.html && (
          <div className="mb-5 text-muted" dangerouslySetInnerHTML={{ __html: product.short_description.html }} />
        )}

        <Options product={product} selection={selection} onChange={setSelection} />

        <div className="flex flex-wrap items-center gap-4">
          {/* Grouped products take a quantity per item instead. */}
          {product.__typename !== "GroupedProduct" && (
            <label className="flex items-center gap-2">
              Qty
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-md border border-line p-2"
              />
            </label>
          )}
          {/* ponytail: not wired yet; step 7 sends { qty, selection } to Magento's addProductsToCart. */}
          <button
            type="button"
            disabled={!canAdd}
            className="rounded-[10px] border border-black bg-black px-8 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
