import ProductCard from "./product-card";

export const GRID = "grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4";

export default function ProductGrid({ products }) {
  return (
    <div className={GRID}>
      {products.map((p) => <ProductCard key={p.sku} product={p} />)}
    </div>
  );
}
