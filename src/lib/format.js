// Shared by server and client components.
export function formatPrice({ value, currency }) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);
}

// Magento order dates are UTC "YYYY-MM-DD HH:mm:ss".
export function formatDate(magentoDate) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(`${magentoDate.replace(" ", "T")}Z`));
}
