import "server-only";

// Called from Server Components / Server Actions only, so no CORS needed.
export async function gql(query, variables = {}) {
  const res = await fetch(process.env.MAGENTO_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Magento GraphQL ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

export const PRODUCT_FIELDS = `
  sku name url_key
  small_image { url label }
  price_range { minimum_price { final_price { value currency } } }
`;
