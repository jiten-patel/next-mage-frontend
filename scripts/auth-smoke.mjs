// Phase 4 auth smoke test: drives the real forms (no-JS submissions) against a running server + Magento.
// Creates a fresh customer each run. Run against a production server (`npm run build && npm start`):
// dev mode embeds React debug info (incl. cookie values) in the page, which fails the token-leak check.
//   BASE_URL=http://localhost:3000 npm run test:auth
import assert from "node:assert/strict";
import { isEmail, missing, passwordError } from "../src/lib/validate.js";
import { check, client, done } from "./smoke-client.mjs";

// --- pure validation ---
assert.equal(isEmail("a@b.co"), true);
assert.equal(isEmail("a@b"), false);
assert.equal(passwordError("Ab1!", { minLength: 8, classes: 3 }), "Use at least 8 characters.");
assert.match(passwordError("alllowercase", { minLength: 8, classes: 3 }), /at least 3 of/);
assert.equal(passwordError("Passw0rdx", { minLength: 8, classes: 3 }), null);
assert.deepEqual(missing({ a: "x", b: "" }, { a: "A", b: "B" }), { b: "B is required." });

// --- end to end ---
const email = `smoke.${Date.now()}@example.com`;
const password = "Sm0ke!Passw0rd";
const guest = client();
const user = client();
let r;

r = await guest.request("/account");
check("unauthenticated /account → /login", r.status === 307 && r.location.endsWith("/login"), `${r.status} ${r.location}`);
r = await guest.request("/account/orders");
check("unauthenticated /account/orders → /login", r.status === 307 && r.location.endsWith("/login"), `${r.status} ${r.location}`);

r = await guest.submit("/login", { email: "", password: "" });
check("login: empty fields", r.text.includes("Email is required.") && r.text.includes("Password is required."));
r = await guest.submit("/login", { email: "not-an-email", password: "x" });
check("login: invalid email", r.text.includes("Enter a valid email address."));
r = await guest.submit("/login", { email: "nobody.smoke@example.com", password: "Wr0ng!pass" });
check("login: invalid credentials", r.text.includes("Invalid email or password") && !guest.jar.has("customer_token"));

r = await guest.submit("/register", { firstname: "Smoke", lastname: "Test", email: "bad", password, confirm: password });
check("register: invalid email", r.text.includes("Enter a valid email address."));
r = await guest.submit("/register", { firstname: "Smoke", lastname: "Test", email, password, confirm: "different" });
check("register: password mismatch", r.text.includes("Passwords don't match."));
r = await guest.submit("/register", { firstname: "Smoke", lastname: "Test", email, password: "weakpassword", confirm: "weakpassword" });
check("register: password policy", r.text.includes("Use at least 3 of"));

r = await user.submit("/register", { firstname: "Smoke", lastname: "Test", email, password, confirm: password });
check("register: valid → /account", r.status === 303 && r.location === "/account", `${r.status} ${r.location} ${r.text.slice(0, 200)}`);
check("register: session cookie set", user.jar.has("customer_token"));
r = await guest.submit("/register", { firstname: "Smoke", lastname: "Test", email, password, confirm: password });
check("register: existing email", r.text.includes("An account with this email already exists."));

r = await user.request("/account");
check("dashboard: welcome by first name", r.status === 200 && r.text.includes("Welcome, Smoke"));
check("token never in HTML", !r.html.includes(user.jar.get("customer_token")));
check("header: account dropdown (My account + Logout)", r.html.includes(">My account<") && r.html.includes(">Logout<") && !r.html.includes(">Register<"));
r = await user.request("/login");
check("authenticated /login → /account", r.status === 307 && r.location.endsWith("/account"), `${r.status} ${r.location}`);

r = await user.request("/account/profile");
check("profile loads", r.html.includes(`value="${email}"`));
r = await user.submit("/account/profile", { firstname: "Smoky", lastname: "Test", email, password: "" });
check("profile: update name", r.text.includes("Your profile has been updated.") && r.text.includes("Smoky"));
r = await user.submit("/account/profile", { firstname: "Smoky", lastname: "Test", email: `new.${email}`, password: "Wr0ng!pass" });
check("profile: wrong password on email change keeps session", r.text.includes("Incorrect password.") && user.jar.has("customer_token"));

r = await user.request("/account/addresses");
check("addresses load (empty)", r.status === 200 && r.text.includes("haven't saved any addresses"));
const address = { firstname: "Smoky", lastname: "Test", telephone: "9999999999", street0: "1 MG Road", city: "Pune", postcode: "411001", country_code: "IN" };
r = await user.request("/account/addresses/new");
const maharashtra = r.html.match(/<option value="(\d+)">Maharashtra<\/option>/)?.[1];
r = await user.submit("/account/addresses/new", { ...address, has_regions: "1", region_id: "" });
check("address: region required", r.text.includes("State/Province is required."));
r = await user.submit("/account/addresses/new", { ...address, has_regions: "1", region_id: maharashtra, default_shipping: "on" });
check("address: create → list", r.status === 303 && r.location === "/account/addresses", `${r.status} ${r.location} ${r.text.slice(0, 300)}`);
r = await user.request("/account/addresses");
const id = r.html.match(/href="\/account\/addresses\/(\d+)"/)?.[1];
check("address: listed", !!id && r.text.includes("1 MG Road") && r.text.includes("Default shipping"));
r = await user.submit(`/account/addresses/${id}`, { ...address, street0: "2 FC Road", has_regions: "1", region_id: maharashtra }, "street0");
check("address: edit", r.status === 303 && (await user.request("/account/addresses")).text.includes("2 FC Road"));
r = await user.request("/account/addresses/99999999");
// Streams behind loading.js, so the status is already 200 when notFound() fires; check the rendered not-found instead.
check("address: unknown id → not found", r.html.includes("This page could not be found."));

r = await user.submit("/account/addresses/new", { ...address, street0: "3 Temp Lane", has_regions: "1", region_id: maharashtra });
r = await user.request("/account/addresses");
const tempId = [...r.html.matchAll(/href="\/account\/addresses\/(\d+)"/g)].map((m) => m[1]).find((x) => x !== id);
const submitDelete = async (addressId) => {
  // Delete forms stream in out of DOM order; pick the one whose bound argument is this address id.
  const form = [...r.html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]).find((f) => f.includes(`value="[${addressId},{}]"`));
  const body = new FormData();
  for (const [, attrs] of form.matchAll(/<input([^>]*type="hidden"[^>]*)>/g)) {
    body.append(attrs.match(/name="([^"]*)"/)[1], (attrs.match(/value="([^"]*)"/)?.[1] ?? "").replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
  }
  return user.request("/account/addresses", { method: "POST", body });
};
r = await submitDelete(tempId);
check("address: delete", !r.text.includes("3 Temp Lane") && r.text.includes("2 FC Road"));
r = await user.request("/account/addresses");
r = await submitDelete(id);
// This Magento allows deleting a default address; if a config refuses, the message must surface as an alert.
check("address: delete default (deleted or friendly alert)", !r.text.includes("2 FC Road") || r.html.includes('role="alert"'));

r = await user.request("/account/orders");
check("orders load", r.status === 200 && (r.text.includes("haven't placed any orders") || r.html.includes("<table")));
r = await user.request("/account/orders/000000000-does-not-exist");
check("order: unknown number → not found", r.html.includes("This page could not be found."));

const staleToken = user.jar.get("customer_token");
r = await user.submit("/account", {}, "$ACTION_ID_");
r = await user.request("/account");
check("logout: session removed", !user.jar.has("customer_token") && r.status === 307 && r.location.endsWith("/login"));
const replay = client();
replay.jar.set("customer_token", staleToken);
r = await replay.request("/account");
check("logout: token revoked at Magento → session-expired", r.status === 307 && r.location.endsWith("/session-expired"), `${r.status} ${r.location}`);
r = await replay.request("/session-expired");
check("session-expired clears cookie → /login?expired=1", r.location.endsWith("/login?expired=1") && !replay.jar.has("customer_token"));
r = await replay.request("/login?expired=1");
check("login shows session expired notice", r.text.includes("Your session has expired."));

r = await user.submit("/login", { email, password });
check("login: valid → /account", r.status === 303 && r.location === "/account" && user.jar.has("customer_token"), `${r.status} ${r.location}`);

done();
