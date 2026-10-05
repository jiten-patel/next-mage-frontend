// Shared by server and client components.
export function formatPrice({ value, currency }) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);
}
