// Cart addresses (CartAddressInterface): used by the checkout page and its actions.

const KEY_FIELDS = ["firstname", "lastname", "company", "city", "postcode", "telephone"];

export function sameAddress(a, b) {
  if (!a || !b) return false;
  return (
    KEY_FIELDS.every((k) => (a[k] ?? "") === (b[k] ?? "")) &&
    a.street?.join("\n") === b.street?.join("\n") &&
    a.country?.code === b.country?.code &&
    (a.region?.label ?? "") === (b.region?.label ?? "")
  );
}

/** Cart address → the customer-address shape <AddressFields> pre-fills from. */
export function toFormAddress(a) {
  if (!a?.firstname) return undefined;
  return { ...a, country_code: a.country?.code, region: { region_id: a.region?.region_id, region: a.region?.label } };
}

export function AddressLines({ address }) {
  return (
    <address className="text-sm not-italic leading-6 text-ink">
      <span className="font-semibold text-black">{address.firstname} {address.lastname}</span><br />
      {address.company && <>{address.company}<br /></>}
      {address.street?.map((s) => <span key={s}>{s}<br /></span>)}
      {[address.city, address.region?.label ?? address.region?.region, address.postcode].filter(Boolean).join(", ")}<br />
      {address.country?.label ?? address.country_code}<br />
      {address.telephone}
    </address>
  );
}
