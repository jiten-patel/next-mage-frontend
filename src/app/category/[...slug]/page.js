import { cache } from "react";
import Link from "next/link";
import Form from "next/form";
import { notFound } from "next/navigation";
import { gql, MagentoError, PRODUCT_FIELDS } from "@/lib/magento";
import Breadcrumbs from "@/components/breadcrumbs";
import ProductGrid from "@/components/product-grid";
import SectionHeading from "@/components/section-heading";
import SortSelect from "@/components/sort-select";

const PAGE_SIZE = 12;

const CATEGORY = `query ($path: String!) {
  categoryList(filters: { url_path: { eq: $path } }) {
    uid name
    breadcrumbs { category_name category_url_path }
    children { uid name url_path include_in_menu }
  }
}`;

// Unfiltered facets: once a filter is applied Magento narrows that attribute's own options,
// which would make picking a second value (OR) impossible. Also the whitelist for URL params.
const FACETS = `query ($uid: String!) {
  products(filter: { category_uid: { eq: $uid } }, pageSize: 1) {
    sort_fields { options { label value } }
    aggregations(filter: { category: { includeDirectChildrenOnly: true } }) { attribute_code label options { label value } }
  }
}`;

const PRODUCTS = `query ($filter: ProductAttributeFilterInput!, $sort: ProductAttributeSortInput, $page: Int!) {
  products(filter: $filter, sort: $sort, pageSize: ${PAGE_SIZE}, currentPage: $page) {
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

// ponytail: only the entities Luma sample data uses; swap for a real decoder if admins add others.
const ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", reg: "®", trade: "™", copy: "©", frac14: "¼", frac12: "½", frac34: "¾" };
const decode = (s) => s.replace(/&(#\d+|\w+);/g, (m, e) => (e[0] === "#" ? String.fromCodePoint(+e.slice(1)) : ENTITIES[e] ?? m));

const dirLabel = (field, dir) => (field === "name" ? (dir === "ASC" ? "A–Z" : "Z–A") : dir === "ASC" ? "Low to high" : "High to low");

// 1 … 4 5 6 … 20 (a single hidden page is shown instead of "…").
function pageList(current, total) {
  const out = [];
  for (let p = 1; p <= total; p++) {
    if (p !== 1 && p !== total && Math.abs(p - current) > 1) continue;
    const gap = p - (out.at(-1) ?? p);
    if (gap === 2) out.push(p - 1);
    else if (gap > 2) out.push("…");
    out.push(p);
  }
  return out;
}

export async function generateMetadata({ params }) {
  const { name } = await getCategory((await params).slug.join("/"));
  return { title: name };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page) || 1);
  const category = await getCategory(slug.join("/"));
  const { products: base } = await gql(FACETS, { uid: category.uid });

  // Children are already listed as links, so the category facet would just repeat them.
  const facets = base.aggregations.filter((f) => f.attribute_code !== "category_uid" && f.options.length > 1);

  // Only known attributes and option values reach Magento (an unknown field fails the whole query).
  const selected = {};
  for (const f of facets) {
    const vals = typeof sp[f.attribute_code] === "string" ? sp[f.attribute_code].split(",") : [];
    const known = vals.filter((v) => f.options.some((o) => o.value === v));
    if (known.length) selected[f.attribute_code] = f.attribute_code === "price" ? known.slice(0, 1) : known;
  }

  const sortOptions = base.sort_fields.options.flatMap(({ label, value }) =>
    value === "position" ? [{ label, value: "position_ASC" }] : ["ASC", "DESC"].map((d) => ({ label: `${label}: ${dirLabel(value, d)}`, value: `${value}_${d}` })),
  );
  const sort = sortOptions.some((o) => o.value === sp.sort) ? sp.sort : undefined;
  const sortVar = sort && { [sort.slice(0, sort.lastIndexOf("_"))]: sort.slice(sort.lastIndexOf("_") + 1) };

  const filter = { category_uid: { eq: category.uid } };
  for (const [code, vals] of Object.entries(selected)) {
    if (code === "price") {
      const [from, to] = vals[0].split("_");
      filter.price = { ...(from && { from }), ...(to && to !== "*" && { to }) };
    } else filter[code] = { in: vals };
  }

  let products;
  try {
    ({ products } = await gql(PRODUCTS, { filter, sort: sortVar, page }));
  } catch (e) {
    // Magento rejects a page past the end; treat a stale/hand-edited ?page= as missing.
    if (page > 1 && e instanceof MagentoError && e.category === "graphql-input") notFound();
    throw e;
  }
  const { current_page, total_pages } = products.page_info;

  const path = `/category/${slug.join("/")}`;
  const href = (state, p) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(state)) if (v?.length) q.set(k, [].concat(v).join(","));
    if (p > 1) q.set("page", p);
    return q.size ? `${path}?${q}` : path;
  };
  const state = { ...selected, sort };
  const toggle = (code, value) => {
    const vals = selected[code] ?? [];
    const next = vals.includes(value) ? vals.filter((v) => v !== value) : code === "price" ? [value] : [...vals, value];
    return href({ ...state, [code]: next });
  };
  const labelOf = (code, value) => decode(facets.find((f) => f.attribute_code === code).options.find((o) => o.value === value).label);
  const active = Object.entries(selected).flatMap(([code, vals]) => vals.map((value) => ({ code, value })));

  return (
    <section className="container py-10 md:py-[60px]">
      <Breadcrumbs items={[...(category.breadcrumbs ?? []).map((b) => ({ label: b.category_name, href: `/category/${b.category_url_path}` })), { label: category.name }]} />
      <SectionHeading as="h1">{category.name}</SectionHeading>

      {category.children.length > 0 && (
        <ul className="mb-8 flex flex-wrap justify-center gap-4">
          {category.children.filter((c) => c.include_in_menu).map((c) => (
            <li key={c.uid}><Link href={`/category/${c.url_path}`} className="underline">{c.name}</Link></li>
          ))}
        </ul>
      )}

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {facets.length > 0 && (
          <aside aria-label="Filters" className="divide-y divide-line border-y border-line lg:self-start">
            {facets.map((f) => (
              <details key={f.attribute_code} open={!!selected[f.attribute_code]} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-black">
                  {decode(f.label)}
                  <span aria-hidden="true" className="transition group-open:rotate-180">⌄</span>
                </summary>
                <ul className="mt-3 space-y-2">
                  {f.options.map((o) => {
                    const on = selected[f.attribute_code]?.includes(o.value);
                    return (
                      <li key={o.value}>
                        <Link href={toggle(f.attribute_code, o.value)} rel="nofollow" scroll={false} aria-current={on ? "true" : undefined} className="flex items-center gap-2 text-sm text-ink hover:text-black">
                          <span aria-hidden="true" className={`size-4 shrink-0 rounded-sm border border-ink ${on ? "bg-black" : ""}`} />
                          {decode(o.label)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </aside>
        )}

        <div className={facets.length ? "" : "lg:col-span-2"}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-ink">{products.total_count} {products.total_count === 1 ? "product" : "products"}</p>
            <Form action={path} scroll={false} className="flex items-center gap-2 text-sm">
              {Object.entries(selected).map(([k, v]) => <input key={k} type="hidden" name={k} value={v.join(",")} />)}
              <label htmlFor="sort">Sort by</label>
              <SortSelect id="sort" options={sortOptions} value={sort ?? "position_ASC"} />
            </Form>
          </div>

          {active.length > 0 && (
            <ul aria-label="Active filters" className="mb-6 flex flex-wrap items-center gap-2">
              {active.map(({ code, value }) => (
                <li key={code + value}>
                  <Link href={toggle(code, value)} rel="nofollow" scroll={false} className="inline-flex items-center gap-1 rounded-full border border-ink px-3 py-1 text-xs font-semibold text-black hover:bg-surface">
                    {labelOf(code, value)} <span aria-hidden="true">×</span><span className="sr-only">(remove filter)</span>
                  </Link>
                </li>
              ))}
              <li><Link href={href({ sort })} rel="nofollow" scroll={false} className="text-xs underline">Clear all</Link></li>
            </ul>
          )}

          {products.items.length ? (
            <ProductGrid products={products.items} />
          ) : active.length ? (
            <p className="py-10 text-center">No products match these filters.</p>
          ) : (
            category.children.length === 0 && <p className="py-10 text-center">No products in this category.</p>
          )}

          {total_pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
              {current_page > 1 && <Link href={href(state, current_page - 1)} className="px-3 py-1.5">← Previous</Link>}
              {pageList(current_page, total_pages).map((p, i) =>
                p === "…" ? (
                  <span key={`gap${i}`} className="px-1">…</span>
                ) : (
                  <Link key={p} href={href(state, p)} aria-current={p === current_page ? "page" : undefined} className="min-w-9 rounded border border-transparent px-3 py-1.5 text-center hover:border-ink aria-[current=page]:bg-black aria-[current=page]:text-white">
                    {p}
                  </Link>
                ),
              )}
              {current_page < total_pages && <Link href={href(state, current_page + 1)} className="px-3 py-1.5">Next →</Link>}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}
