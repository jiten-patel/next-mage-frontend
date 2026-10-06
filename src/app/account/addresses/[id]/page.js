import Link from "next/link";
import { notFound } from "next/navigation";
import { customerQuery } from "@/lib/auth";
import { ADDRESS_FIELDS, getCountries } from "@/lib/magento";
import { saveAddress } from "../../actions";
import { ActionForm, SubmitButton } from "@/components/form";
import AddressFields from "@/components/address-fields";
import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "Address" };

// /account/addresses/new creates; /account/addresses/<id> edits.
export default async function AddressPage({ params }) {
  const { id } = await params;
  const isNew = id === "new";
  const [address, countries] = await Promise.all([
    isNew ? null : customerQuery(`{ customer { addresses { ${ADDRESS_FIELDS} } } }`).then(({ customer }) => customer.addresses?.find((a) => String(a.id) === id)),
    getCountries(),
  ]);
  if (!isNew && !address) notFound();

  return (
    <>
      <Breadcrumbs items={[{ label: "My account", href: "/account" }, { label: "Addresses", href: "/account/addresses" }, { label: isNew ? "Add address" : "Edit address" }]} />
      <h1 className="mb-6 text-2xl font-semibold text-black md:text-[2rem]">{isNew ? "Add address" : "Edit address"}</h1>
      <ActionForm action={saveAddress.bind(null, isNew ? null : address.id)} className="max-w-lg space-y-4">
        <AddressFields countries={countries} address={address} />
        <fieldset className="space-y-2">
          <legend className="sr-only">Defaults</legend>
          {[["default_shipping", "Use as my default shipping address"], ["default_billing", "Use as my default billing address"]].map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name={name} defaultChecked={address?.[name]} className="size-4 accent-black" />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="flex items-center gap-4">
          <SubmitButton pendingText="Saving…">Save address</SubmitButton>
          <Link href="/account/addresses" className="text-sm text-ink underline underline-offset-4">Cancel</Link>
        </div>
      </ActionForm>
    </>
  );
}
