// Cart + checkout smoke test against a running production server + Magento (`npm run build && npm start`).
// Add to cart is called exactly as the browser does (Next-Action request); cart edits use the real no-JS forms.
//   BASE_URL=http://localhost:3000 npm run test:cart
import { readFileSync } from "node:fs";
import { check, client, done } from "./smoke-client.mjs";

const manifest = JSON.parse(readFileSync(new URL("../.next/server/server-reference-manifest.json", import.meta.url), "utf8"));
const actionId = (name) =>
  Object.entries(manifest.node).find(([, v]) => Object.values(v.workers).some((w) => w.exportedName === name))[0];

const PRODUCT = "/product/didi-sport-watch"; // simple, SKU 24-WG02
const SHORTS = { sku: "WSH12", quantity: 1, selected_options: ["Y29uZmlndXJhYmxlLzE0NC8xNzE=", "Y29uZmlndXJhYmxlLzkzLzUz"] }; // 28 / Green

async function addToCart(c, items) {
  const r = await c.request(PRODUCT, {
    method: "POST",
    body: JSON.stringify([items]),
    headers: { "Next-Action": actionId("addToCart"), Accept: "text/x-component", "Content-Type": "text/plain;charset=UTF-8" },
  });
  // Flight row 0 points at the action result row ("a":"$@N"); row N is the returned object.
  const row = r.html.match(/"a":"\$@(\w+)"/)?.[1];
  const result = JSON.parse(r.html.match(new RegExp(`^${row}:(.*)$`, "m"))?.[1] ?? "null");
  return { ...r, error: result ? result.error : `no action result (${r.status})` };
}
const count = (r) => Number(r.html.match(/aria-label="Cart, (\d+) items?"/)?.[1]);

const guest = client();
let r = await addToCart(guest, [{ sku: "24-WG02", quantity: 2 }]);
check("add simple: no error", r.status === 200 && !r.error, `${r.status} ${r.error}`);
check("add: guest cart cookie set", guest.jar.has("cart_id"));
check("add: response re-renders header with new cart", r.html.includes('"total_quantity":2'));
r = await addToCart(guest, [SHORTS]);
check("add configurable", !r.error, r.error);
r = await addToCart(guest, [{ ...SHORTS, selected_options: [] }]);
check("add configurable without options → friendly error", /choose options/i.test(r.error ?? ""), r.error);
r = await addToCart(guest, [{ sku: "24-WG02", quantity: 9999 }]);
check("add excessive qty → error", !!r.error, r.error);
r = await addToCart(guest, "junk");
check("add malformed input → rejected", r.error === "Please choose a product and quantity.", r.error);

r = await guest.request("/cart");
check("cart page lists items", r.text.includes("Didi Sport Watch") && r.text.includes("Erika Running Short") && /Color:\s+Green/.test(r.text));
check("header count", count(r) === 3, String(count(r)));
check("cart id never in HTML", !r.html.includes(guest.jar.get("cart_id")));

r = await guest.submit("/cart", { quantity: "3" }, "quantity");
check("update qty", count(r) === 4, String(count(r)));
r = await guest.submit("/cart", { quantity: "0" }, "quantity");
check("update qty 0 → validation error", r.text.includes("Enter a quantity between 1 and 10000.") && count(r) === 4);
r = await guest.submit("/cart", { remove: "1" }, "uid");
check("remove line", count(r) === 1 && !r.text.includes("Didi Sport Watch"), String(count(r)));

const stale = client();
stale.jar.set("cart_id", "not-a-real-cart");
r = await stale.request("/cart");
check("stale cart cookie → empty cart", r.text.includes("Your cart is empty."));
r = await addToCart(stale, [{ sku: "24-WG02", quantity: 1 }]);
check("stale cart cookie → add starts a new cart", !r.error && stale.jar.get("cart_id") !== "not-a-real-cart", r.error);

const email = `cart.${Date.now()}@example.com`;
const password = "Sm0ke!Passw0rd";
r = await guest.submit("/register", { firstname: "Cart", lastname: "Test", email, password, confirm: password });
check("register → /account", r.status === 303 && r.location === "/account", `${r.status} ${r.location}`);
check("login merges guest cart: cookie dropped", !guest.jar.has("cart_id"));
r = await guest.request("/cart");
check("login merges guest cart: items now in customer cart", r.text.includes("Erika Running Short") && count(r) === 1);
r = await addToCart(guest, [{ sku: "24-WG02", quantity: 1 }]);
check("customer add uses customer cart (no cookie)", !r.error && !guest.jar.has("cart_id"), r.error);

await guest.submit("/account", {}, "$ACTION_ID_"); // header logout
r = await guest.request("/cart");
check("logout → empty cart", r.text.includes("Your cart is empty.") && !count(r));
// Magento revokes every token issued up to the logout second (1s resolution), so a same-second re-login gets a dead token.
await new Promise((resolve) => setTimeout(resolve, 1100));
await guest.submit("/login", { email, password });
r = await guest.request("/cart");
check("login again → customer cart restored", count(r) === 2, String(count(r)));

// --- checkout ---
// Forms are told apart by the server action id React embeds in each one.
const form = (action, field) => (f) => f.includes(actionId(action)) && (!field || f.includes(`name="${field}"`));
const ADDRESS = { firstname: "Smoky", lastname: "Test", telephone: "9999999999", street0: "1 MG Road", city: "Pune", postcode: "411001", country_code: "IN", region_id: "589" }; // Maharashtra
const orderNumber = (r) => decodeURIComponent(r.location.match(/order=([^&]+)/)?.[1] ?? "");

const shopper = client();
r = await shopper.request("/checkout");
// checkout/loading.js streams first, so the redirect arrives in-stream (meta refresh + client redirect) instead of as a 307.
check("checkout: empty cart → /cart", (r.status === 307 && r.location.endsWith("/cart")) || /http-equiv="refresh" content="\d+;url=\/cart"/.test(r.html), `${r.status} ${r.location}`);
await addToCart(shopper, [{ sku: "24-UG06", quantity: 1 }]); // Affirm Water Bottle: coupon H20 applies
r = await shopper.request("/checkout");
check("checkout: loads with Place order disabled", r.status === 200 && r.text.includes("To place your order, add your email"));

r = await shopper.submit("/checkout", { coupon_code: "NOPE" });
check("coupon: invalid code", r.text.includes("This coupon code isn't valid for your cart."));
r = await shopper.submit("/checkout", { coupon_code: "H20" });
check("coupon: H20 applied with discount", /Coupon\s+H20\s+applied/.test(r.text) && r.text.includes("−"));
r = await shopper.submit("/checkout", {}, form("removeCoupon"));
check("coupon: removed", !/Coupon\s+H20\s+applied/.test(r.text) && r.html.includes('name="coupon_code"'));

r = await shopper.submit("/checkout", {}, form("placeOrder"));
check("place order before details → friendly error", r.html.includes('role="alert"') && !r.location);

r = await shopper.submit("/checkout", { email: "not-an-email" });
check("email: invalid", r.text.includes("Enter a valid email address."));
r = await shopper.submit("/checkout", { email: `guest.${Date.now()}@example.com` });
check("email: saved", r.text.includes("Update") && !r.text.includes("add your email"));

r = await shopper.submit("/checkout", { ...ADDRESS, firstname: "" }, form("saveShippingAddress", "firstname"));
check("shipping address: validation", r.text.includes("First name is required."));
r = await shopper.submit("/checkout", ADDRESS, form("saveShippingAddress", "firstname"));
check("shipping address: saved, billing follows", r.text.includes("1 MG Road") && r.text.includes("Same as shipping address"));
check("shipping methods listed", r.html.includes('value="flatrate|flatrate"'));
r = await shopper.submit("/checkout", { shipping_method: "flatrate|flatrate" });
check("shipping method: saved, in totals", r.text.includes("Shipping (Flat Rate)"));

r = await shopper.submit("/checkout", { ...ADDRESS, street0: "9 Billing Street" }, form("saveBillingAddress", "firstname"));
check("billing: different address", r.text.includes("9 Billing Street") && r.text.includes("Use my shipping address instead"));
r = await shopper.submit("/checkout", {}, form("saveBillingAddress", "same_as_shipping"));
check("billing: back to same as shipping", r.text.includes("Same as shipping address"));

r = await shopper.submit("/checkout", { payment_method: "checkmo" });
check("payment: saved, ready to place", /<input[^>]*checked=""[^>]*value="checkmo"/.test(r.html) && !r.text.includes("To place your order"));
r = await shopper.submit("/checkout", {}, form("placeOrder"));
const guestOrder = orderNumber(r);
check("guest: place order → success page", r.status === 303 && r.location.startsWith("/checkout/success?order=") && !!guestOrder, `${r.status} ${r.location} ${r.text.match(/role="alert"[^<]*<[^>]*>[^<]*/)?.[0]}`);
check("guest: cart cookie dropped after order", !shopper.jar.has("cart_id"));
r = await shopper.request(r.location);
check("success page shows order number", r.text.includes(`#${guestOrder}`));
r = await shopper.request("/cart");
check("cart empty after order", r.text.includes("Your cart is empty."));

const virtual = client();
await addToCart(virtual, [{ sku: "TEST-VIRTUAL-1", quantity: 1 }]);
r = await virtual.request("/checkout");
check("virtual cart: no shipping steps, billing form open", !r.text.includes("Shipping method") && r.html.includes(actionId("saveBillingAddress")) && r.text.includes("add your email, a billing address, a payment method"));

const member = client();
await member.submit("/register", { firstname: "Checkout", lastname: "Test", email: `checkout.${Date.now()}@example.com`, password, confirm: password });
await addToCart(member, [{ sku: "24-WG02", quantity: 1 }]);
r = await member.request("/checkout");
check("customer: email from account", r.text.includes("Signed in as"));
await member.submit("/checkout", ADDRESS, form("saveShippingAddress", "firstname"));
await member.submit("/checkout", { shipping_method: "flatrate|flatrate" });
await member.submit("/checkout", { payment_method: "checkmo" });
r = await member.submit("/checkout", {}, form("placeOrder"));
const memberOrder = orderNumber(r);
check("customer: place order", r.status === 303 && !!memberOrder, `${r.status} ${r.location}`);
r = await member.request("/account/orders");
check("customer: order in order history", r.text.includes(memberOrder));
r = await member.request("/cart");
check("customer: fresh cart after order", r.text.includes("Your cart is empty."));

done();
