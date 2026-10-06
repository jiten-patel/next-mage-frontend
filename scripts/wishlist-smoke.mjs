// Wishlist smoke test against a running production server + Magento (`npm run build && npm start`).
// Actions are called exactly as the browser does (Next-Action requests). Creates a fresh customer each run.
//   BASE_URL=http://localhost:3000 npm run test:wishlist
import { callAction, check, client, done } from "./smoke-client.mjs";

const WATCH = "/product/didi-sport-watch"; // simple, SKU 24-WG02
const SHORTS = "/product/erika-running-short"; // configurable, SKU WSH12
const GREEN_28 = ["Y29uZmlndXJhYmxlLzE0NC8xNzE=", "Y29uZmlndXJhYmxlLzkzLzUz"];
const count = (r) => Number(r.html.match(/aria-label="Wishlist, (\d+) items?"/)?.[1]);
const ids = (r) => [...new Set([...r.html.matchAll(/\\?"itemId\\?":\\?"(\d+)/g)].map((m) => m[1]))];

const guest = client();
let r = await callAction(guest, WATCH, "addToWishlist", [{ sku: "24-WG02" }]);
check("guest add → redirected to login", r.redirect.startsWith("/login?wishlist=1"), `${r.status} redirect=${r.redirect}`);
r = await guest.request("/login?wishlist=1");
check("login shows wishlist notice", r.text.includes("Log in to save items to your wishlist."));
r = await guest.request("/account/wishlist");
check("guest /account/wishlist → /login", r.status === 307 && r.location.endsWith("/login"), `${r.status} ${r.location}`);

const user = client();
const password = "Sm0ke!Passw0rd";
r = await user.submit("/register", { firstname: "Wish", lastname: "List", email: `wish.${Date.now()}@example.com`, password, confirm: password });
check("register test customer", r.status === 303, `${r.status}`);

r = await user.request("/account/wishlist");
check("empty wishlist page", r.status === 200 && r.text.includes("Your wishlist is empty") && count(r) === 0, `status=${r.status} empty=${r.text.includes("Your wishlist is empty")} count=${count(r)}`);
r = await user.request(WATCH);
check("product page: heart not saved", r.html.includes('aria-label="Add to wishlist"'));

r = await callAction(user, WATCH, "addToWishlist", [{ sku: "24-WG02" }]);
check("add simple", r.status === 200 && r.result && !r.result.error, JSON.stringify(r.result));
r = await callAction(user, SHORTS, "addToWishlist", [{ sku: "WSH12", selected_options: GREEN_28 }]);
check("add configurable with chosen variant", r.result && !r.result.error, JSON.stringify(r.result));
r = await callAction(user, SHORTS, "addToWishlist", [{ sku: "WSH12" }]);
check("add configurable without variant", r.result && !r.result.error, JSON.stringify(r.result));
r = await callAction(user, WATCH, "addToWishlist", [{ sku: "NOPE-NOT-A-SKU" }]);
check("add unknown sku → friendly error", typeof r.result?.error === "string" && r.result.error.length > 0, JSON.stringify(r.result));
r = await callAction(user, WATCH, "addToWishlist", ["junk"]);
check("add malformed input → rejected", r.result?.error === "Please choose a product.", JSON.stringify(r.result));

r = await user.request(WATCH);
check("product page: heart saved + header count 3", r.html.includes('aria-label="Remove from wishlist"') && count(r) === 3, `count=${count(r)}`);

r = await user.request("/account/wishlist");
let items = ids(r);
check("wishlist lists 3 items", items.length === 3 && r.text.includes("Didi Sport Watch") && r.text.includes("Erika Running Short"), items.join(","));
check("variant options shown", r.text.includes("Color: Green") && r.text.includes("Size: 28"));
check("parent-only configurable offers Choose options", r.text.includes("Choose options"));

// Item ids in page order: newest Magento ids are the two shorts lines; the watch is the lowest id.
const [watchId] = [...items].sort((a, b) => a - b);
r = await callAction(user, "/account/wishlist", "moveToCart", [watchId]);
check("move simple to cart", r.result && !r.result.error, JSON.stringify(r.result));
r = await user.request("/account/wishlist");
check("moved item leaves wishlist, cart has it", ids(r).length === 2 && !ids(r).includes(watchId) && /aria-label="Cart, [1-9]/.test(r.html), ids(r).join(","));

r = await callAction(user, "/account/wishlist", "moveToCart", ["999999999"]);
check("move unknown item → friendly error", typeof r.result?.error === "string", JSON.stringify(r.result));
r = await callAction(user, "/account/wishlist", "removeFromWishlist", [["1; drop"]]);
check("remove malformed ids → rejected", r.result?.error === "Please choose an item.", JSON.stringify(r.result));

// Heart on the product page removes every saved line for that product (both shorts lines).
r = await user.request(SHORTS);
const shortIds = [...new Set([...r.html.matchAll(/\\?"wishlistItemIds\\?":\[([^\]]*)\]/g)].flatMap((m) => m[1].match(/\d+/g) ?? []))];
r = await callAction(user, SHORTS, "removeFromWishlist", [shortIds]);
check("product heart removes all lines for the product", shortIds.length === 2 && r.result && !r.result.error, `${shortIds} ${JSON.stringify(r.result)}`);
r = await user.request("/account/wishlist");
check("wishlist empty again, header count 0", r.text.includes("Your wishlist is empty") && count(r) === 0);

done();
