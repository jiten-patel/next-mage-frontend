// Category filter / sort / pagination smoke test against a running server + Magento (Luma sample data).
//   BASE_URL=http://localhost:3000 npm run test:listing
import { check, client, done } from "./smoke-client.mjs";

const c = client();
const CAT = "/category/men/tops-men";
const total = (r) => Number(r.text.match(/(\d+)\s+products?/)?.[1]);
const names = (r) => [...r.html.matchAll(/href="\/product\/[^"]+"[^>]*>([^<]+)</g)].map((m) => m[1]);

let r = await c.request(CAT);
const all = total(r);
check("category renders with count", r.status === 200 && all > 12, `${r.status} ${all}`);
check("filters sidebar", r.html.includes('aria-label="Filters"') && r.text.includes("Color"));
check("pagination links", r.html.includes(`href="${CAT}?page=2"`) && r.html.includes('aria-current="page"'));
check("sort select", r.html.includes('name="sort"') && r.html.includes('value="price_DESC"'));
check("entities decoded", r.html.includes("Cocona®") || !r.html.includes("&amp;reg;"));

r = await c.request(`${CAT}?color=49`);
const black = total(r);
check("single filter narrows", black > 0 && black < all, `${black} of ${all}`);
check("active chip + clear all", r.html.includes('aria-label="Active filters"') && r.text.includes("Clear all"));

r = await c.request(`${CAT}?color=49,58`);
check("same-attribute values OR together", total(r) > black, `${total(r)} vs ${black}`);

r = await c.request(`${CAT}?color=49&price=20_30`);
check("price + color AND together", total(r) > 0 && total(r) < black, `${total(r)}`);

r = await c.request(`${CAT}?bogus=1&color=nope`);
check("unknown params ignored", r.status === 200 && total(r) === all, `${r.status} ${total(r)}`);

const asc = names(await c.request(`${CAT}?sort=name_ASC`));
const desc = names(await c.request(`${CAT}?sort=name_DESC`));
check("sort by name", asc.length > 1 && asc[0] !== desc[0] && asc[0].localeCompare(asc[1]) <= 0, `${asc[0]} / ${desc[0]}`);

r = await c.request(`${CAT}?sort=name_ASC&page=2`);
check("page 2 keeps sort", r.status === 200 && r.html.includes(`href="${CAT}?sort=name_ASC"`) && !names(r).includes(asc[0]));

r = await c.request(`${CAT}?page=999`);
r = await c.request("/category/men/tops-men/tees-men");
check("category breadcrumb trail", r.html.includes('href="/category/men"') && r.html.includes('href="/category/men/tops-men"') && /aria-current="page"[^>]*>Tees</.test(r.html));

r = await c.request("/product/helios-evercool-trade-tee");
check("product breadcrumb via deepest menu category", r.html.includes('href="/category/men/tops-men/tees-men"') && !r.html.includes('href="/category/collections/eco-friendly"') && r.html.includes('aria-label="Breadcrumb"'));

r = await c.request("/cart");
check("cart breadcrumb", r.html.includes('aria-label="Breadcrumb"'));

// loading.js streams a 200 before notFound() runs, so check the rendered 404 instead of the status.
check("page past end is 404", r.html.includes("This page could not be found") && !names(r).length, `${r.status}`);

done();
