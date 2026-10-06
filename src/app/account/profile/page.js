import { requireCustomer } from "@/lib/auth";
import { updateProfile } from "../actions";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const customer = await requireCustomer();

  return (
    <>
      <Breadcrumbs items={[{ label: "My account", href: "/account" }, { label: "Profile" }]} />
      <h1 className="mb-6 text-2xl font-semibold text-black md:text-[2rem]">Profile</h1>
      <ActionForm action={updateProfile} className="max-w-lg space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="firstname" autoComplete="given-name" defaultValue={customer.firstname} required />
          <Field label="Last name" name="lastname" autoComplete="family-name" defaultValue={customer.lastname} required />
        </div>
        <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={customer.email} required />
        <Field label="Current password" name="password" type="password" autoComplete="current-password" hint="Only needed if you change your email." />
        <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
      </ActionForm>
    </>
  );
}
