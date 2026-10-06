"use client";

// Submits its <Form> on change; the noscript button keeps sorting working without JS.
export default function SortSelect({ id, options, value }) {
  return (
    <>
      <select key={value} id={id} name="sort" defaultValue={value} onChange={(e) => e.target.form.requestSubmit()} className="rounded border border-ink bg-white px-2 py-1.5">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <noscript><button type="submit" className="underline">Apply</button></noscript>
    </>
  );
}
