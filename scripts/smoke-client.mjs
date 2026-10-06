// Shared by the smoke tests: a cookie-jar HTTP client that submits the real forms (no-JS submissions).
export const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let failures = 0;
export const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failures++;
};
export const done = () => {
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
};

export function client() {
  const jar = new Map();
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  async function request(path, init = {}) {
    const res = await fetch(BASE + path, { ...init, redirect: "manual", headers: { cookie: cookie(), origin: BASE, ...init.headers } });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [k, v] = pair.split("=");
      if (!v || /expires=thu, 01 jan 1970/i.test(c)) jar.delete(k); else jar.set(k, v);
    }
    const html = (await res.text()).replaceAll("<!-- -->", "");
    return { status: res.status, headers: res.headers, location: res.headers.get("location") ?? "", html, text: html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'") };
  }
  // Load `path`, find the form containing the first field (or matching a predicate on its HTML), post it with its hidden action inputs.
  async function submit(path, fields, formHint = Object.keys(fields)[0]) {
    const { html } = await request(path);
    const form = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => m[0]).find(typeof formHint === "function" ? formHint : (f) => f.includes(`name="${formHint}`));
    if (!form) throw new Error(`no form with ${formHint} on ${path}`);
    const body = new FormData();
    for (const [, attrs] of form.matchAll(/<input([^>]*type="hidden"[^>]*)>/g)) {
      const name = attrs.match(/name="([^"]*)"/)?.[1];
      const value = (attrs.match(/value="([^"]*)"/)?.[1] ?? "").replaceAll("&quot;", '"').replaceAll("&amp;", "&");
      if (name) body.append(name, value);
    }
    for (const [k, v] of Object.entries(fields)) body.append(k, v);
    return request(path, { method: "POST", body });
  }
  return { request, submit, jar };
}


// Calls a server action exactly as the browser does (Next-Action request). `path` must be a page that uses it.
let manifest;
export async function callAction(c, path, name, args) {
  manifest ??= JSON.parse((await import("node:fs")).readFileSync(new URL("../.next/server/server-reference-manifest.json", import.meta.url), "utf8"));
  const id = Object.entries(manifest.node).find(([, v]) => Object.values(v.workers).some((w) => w.exportedName === name))?.[0];
  const r = await c.request(path, {
    method: "POST",
    body: JSON.stringify(args),
    headers: { "Next-Action": id, Accept: "text/x-component", "Content-Type": "text/plain;charset=UTF-8" },
  });
  // Flight row 0 points at the action result row ("a":"$@N"); row N is the returned object.
  const row = r.html.match(/"a":"\$@(\w+)"/)?.[1];
  const result = row ? JSON.parse(r.html.match(new RegExp(`^${row}:(.*)$`, "m"))?.[1] ?? "null") : null;
  return { ...r, result, redirect: r.headers.get("x-action-redirect") ?? "" };
}
