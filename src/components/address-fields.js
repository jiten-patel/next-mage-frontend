"use client";

import { use, useId, useState } from "react";
import { Field, FormState, INPUT } from "./form";

// Region is a dropdown for countries Magento lists regions for, free text otherwise.
export default function AddressFields({ countries, address }) {
  const { values, fieldErrors } = use(FormState);
  const id = useId(); // checkout renders shipping + billing forms on one page
  const [country, setCountry] = useState(values?.country_code || address?.country_code || "IN");
  const regions = countries.find((c) => c.id === country)?.available_regions;
  const street = address?.street ?? [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstname" autoComplete="given-name" defaultValue={address?.firstname} required />
        <Field label="Last name" name="lastname" autoComplete="family-name" defaultValue={address?.lastname} required />
      </div>
      <Field label="Company (optional)" name="company" autoComplete="organization" defaultValue={address?.company ?? ""} />
      <Field label="Phone number" name="telephone" type="tel" autoComplete="tel" defaultValue={address?.telephone ?? ""} required />
      <Field label="Street address" name="street0" autoComplete="address-line1" defaultValue={street[0]} required />
      <Field label="Street address line 2 (optional)" name="street1" autoComplete="address-line2" defaultValue={street[1] ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" name="city" autoComplete="address-level2" defaultValue={address?.city} required />
        <Field label="ZIP / Postal code" name="postcode" autoComplete="postal-code" defaultValue={address?.postcode ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-country`} className="mb-1 block text-sm font-medium text-ink">Country</label>
          <select id={`${id}-country`} name="country_code" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country" className={INPUT} required>
            {countries.map((c) => <option key={c.id} value={c.id}>{c.full_name_english}</option>)}
          </select>
        </div>
        {regions?.length ? (
          <div>
            <label htmlFor={`${id}-region`} className="mb-1 block text-sm font-medium text-ink">State / Province</label>
            <input type="hidden" name="has_regions" value="1" />
            <select
              key={country}
              id={`${id}-region`}
              name="region_id"
              defaultValue={values?.region_id ?? (address?.country_code === country ? address?.region?.region_id ?? "" : "")}
              aria-invalid={!!fieldErrors?.region_id}
              aria-describedby={fieldErrors?.region_id ? `${id}-region-error` : undefined}
              className={INPUT}
              required
            >
              <option value="">Select…</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {fieldErrors?.region_id && <p id={`${id}-region-error`} className="mt-1 text-xs text-red-700">{fieldErrors.region_id}</p>}
          </div>
        ) : (
          <Field key={country} label="State / Province (optional)" name="region" autoComplete="address-level1" defaultValue={address?.region?.region ?? ""} />
        )}
      </div>
    </>
  );
}
