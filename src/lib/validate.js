// Pure form checks shared by server actions. Magento re-validates everything; these just give fast, friendly errors.

export const field = (formData, name) => String(formData.get(name) ?? "").trim();

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Mirrors Magento's policy (storeConfig): minimum length + N of the 4 character classes.
export function passwordError(password, { minLength, classes }) {
  if (password.length < minLength) return `Use at least ${minLength} characters.`;
  const found = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((r) => r.test(password)).length;
  if (found < classes) return `Use at least ${classes} of: lowercase letters, uppercase letters, numbers, special characters.`;
  return null;
}

// Returns { fieldName: message } for blank required fields.
export function missing(values, labels) {
  return Object.fromEntries(Object.entries(labels).filter(([k]) => !values[k]).map(([k, label]) => [k, `${label} is required.`]));
}

const ADDRESS_LABELS = { firstname: "First name", lastname: "Last name", street0: "Street address", city: "City", telephone: "Phone number", country_code: "Country" };

// Fields posted by <AddressFields>; shared by account address and checkout forms.
export function addressValues(formData) {
  const values = Object.fromEntries(["firstname", "lastname", "company", "street0", "street1", "city", "region", "region_id", "postcode", "country_code", "telephone"].map((k) => [k, field(formData, k)]));
  const fieldErrors = missing(values, ADDRESS_LABELS);
  if (formData.get("has_regions") && !values.region_id) fieldErrors.region_id = "State/Province is required.";
  return { values, fieldErrors };
}
