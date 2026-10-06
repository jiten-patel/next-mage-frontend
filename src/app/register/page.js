import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, getPasswordPolicy } from "@/lib/auth";
import { register } from "@/lib/auth-actions";
import { ActionForm, Field, SubmitButton } from "@/components/form";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getCustomer()) redirect("/account");
  const { minLength, classes } = await getPasswordPolicy().catch(() => ({ minLength: 8, classes: 0 }));
  const hint = `At least ${minLength} characters${classes ? `, using ${classes} of: lowercase, uppercase, numbers, special characters` : ""}.`;

  return (
    <section className="container flex justify-center py-12 md:py-20">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-semibold text-black md:text-[2rem]">Create account</h1>
        <ActionForm action={register}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" name="firstname" autoComplete="given-name" required autoFocus />
            <Field label="Last name" name="lastname" autoComplete="family-name" required />
          </div>
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={minLength} required hint={hint} />
          <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required />
          <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
        </ActionForm>
        <p className="mt-8 border-t border-line pt-6 text-sm text-ink">
          Already have an account? <Link href="/login" className="font-semibold text-black underline underline-offset-4">Log in</Link>
        </p>
      </div>
    </section>
  );
}
