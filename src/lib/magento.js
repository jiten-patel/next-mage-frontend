import "server-only";

// `category` is Magento's extensions.category (e.g. "graphql-authentication", "graphql-input"),
// or "unavailable" when Magento couldn't be reached. `message` is internal: never show it raw.
export class MagentoError extends Error {
  constructor(message, category) {
    super(message);
    this.category = category;
  }
}

// Called from Server Components / Server Actions only, so no CORS needed.
// Customer requests (token) and mutations (noStore) must never hit the shared fetch cache.
export async function gql(query, variables = {}, { token, noStore } = {}) {
  let res;
  try {
    res = await fetch(process.env.MAGENTO_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: JSON.stringify({ query, variables }),
      ...(token || noStore ? { cache: "no-store" } : { next: { revalidate: 300 } }),
    });
  } catch (e) {
    throw new MagentoError(e.message, "unavailable");
  }

  // Auth failures come back as 401/403 with a GraphQL body, so read it before checking status.
  const json = await res.json().catch(() => null);
  if (json?.errors) throw new MagentoError(json.errors.map((e) => e.message).join("; "), json.errors[0].extensions?.category);
  if (!res.ok || !json) throw new MagentoError(`Magento GraphQL ${res.status} ${res.statusText}`, "unavailable");
  return json.data;
}

export const PRODUCT_FIELDS = `
  sku name url_key
  small_image { url label }
  price_range { minimum_price { final_price { value currency } } }
`;

export const ADDRESS_FIELDS = `
  id firstname lastname company street city postcode country_code telephone
  region { region region_code region_id } default_billing default_shipping
`;

// Shared by address list (country names) and address form (country/region pickers).
export async function getCountries() {
  const { countries } = await gql(`{ countries { id full_name_english available_regions { id code name } } }`);
  return countries.sort((a, b) => (a.full_name_english ?? "").localeCompare(b.full_name_english ?? ""));
}
