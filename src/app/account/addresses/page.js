import Link from "next/link";
import { customerQuery } from "@/lib/auth";
import { ADDRESS_FIELDS, getCountries } from "@/lib/magento";
import { deleteAddress } from "../actions";
import { ActionForm, SubmitButton } from "@/components/form";
import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const [{ customer }, countries] = await Promise.all([customerQuery(`{ customer { addresses { ${ADDRESS_FIELDS} } } }`), getCountries()]);
  const countryName = Object.fromEntries(countries.map((c) => [c.id, c.full_name_english]));
  const addresses = customer.addresses ?? [];

  return (
    <>
      <Breadcrumbs items={[{ label: "My account", href: "/account" }, { label: "Addresses" }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-black md:text-[2rem]">Addresses</h1>
        <Link href="/account/addresses/new" className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink">Add address</Link>
      </div>
      {!addresses.length && <p className="text-sm text-muted">You haven&apos;t saved any addresses yet.</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="flex flex-col rounded border border-line p-5">
            <div className="mb-2 flex flex-wrap gap-2">
              {a.default_shipping && <span className="rounded bg-surface px-2 py-0.5 text-xs font-semibold text-ink">Default shipping</span>}
              {a.default_billing && <span className="rounded bg-surface px-2 py-0.5 text-xs font-semibold text-ink">Default billing</span>}
            </div>
            <address className="mb-4 grow text-sm not-italic leading-6 text-ink">
              <span className="font-semibold text-black">{a.firstname} {a.lastname}</span><br />
              {a.company && <>{a.company}<br /></>}
              {a.street?.map((s) => <span key={s}>{s}<br /></span>)}
              {[a.city, a.region?.region, a.postcode].filter(Boolean).join(", ")}<br />
              {countryName[a.country_code] ?? a.country_code}<br />
              {a.telephone}
            </address>
            <div className="flex items-start gap-4">
              <Link href={`/account/addresses/${a.id}`} className="py-2.5 text-sm font-semibold text-black underline underline-offset-4">Edit</Link>
              <ActionForm action={deleteAddress.bind(null, a.id)} className="space-y-2">
                <SubmitButton pendingText="Deleting…" confirm="Delete this address?" className="!bg-white !px-0 !text-black underline underline-offset-4">Delete</SubmitButton>
              </ActionForm>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
