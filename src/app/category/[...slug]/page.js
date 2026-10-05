import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gql, PRODUCT_FIELDS } from "@/lib/magento";
import ProductGrid from "@/components/product-grid";
import SectionHeading from "@/components/section-heading";

const PAGE_SIZE = 12;

const CATEGORY = `query ($path: String!) {
  categoryList(filters: { url_path: { eq: $path } }) {
    uid name
    children { uid name url_path include_in_menu }
  }
}`;

const PRODUCTS = `query ($uid: String!, $page: Int!) {
  products(filter: { category_uid: { eq: $uid } }, pageSize: ${PAGE_SIZE}, currentPage: $page) {
    total_count
    page_info { current_page total_pages }
    items { ${PRODUCT_FIELDS} }
  }
}`;

// Deduped across generateMetadata and the page within one request.
const getCategory = cache(async (path) => {
  const { categoryList } = await gql(CATEGORY, { path });
  return categoryList[0] ?? notFound();
});

export async function generateMetadata({ params }) {
  const { name } = await getCategory((await params).slug.join("/"));
  return { title: name };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const page = Math.max(1, parseInt((await searchParams).page) || 1);
  const category = await getCategory(slug.join("/"));
  const { products } = await gql(PRODUCTS, { uid: category.uid, page });
  const { current_page, total_pages } = products.page_info;
  const href = (p) => `/category/${slug.join("/")}?page=${p}`;

  return (
    <section className="container py-10 text-center md:py-[60px]">
      <SectionHeading as="h1">{category.name}</SectionHeading>

      {category.children.length > 0 && (
        <ul className="mb-8 flex flex-wrap justify-center gap-4">
          {category.children.filter((c) => c.include_in_menu).map((c) => (
            <li key={c.uid}><Link href={`/category/${c.url_path}`} className="underline">{c.name}</Link></li>
          ))}
        </ul>
      )}

      {products.items.length ? (
        <ProductGrid products={products.items} />
      ) : (
        category.children.length === 0 && <p>No products in this category.</p>
      )}

      {total_pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-6">
          {current_page > 1 && <Link href={href(current_page - 1)}>← Previous</Link>}
          <span>Page {current_page} of {total_pages}</span>
          {current_page < total_pages && <Link href={href(current_page + 1)}>Next →</Link>}
        </nav>
      )}
    </section>
  );
}
