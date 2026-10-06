import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth";
import { login } from "@/lib/auth-actions";
import { ActionForm, Field, SubmitButton } from "@/components/form";

export const metadata = { title: "Log in" };

const NOTICES = {
  wishlist: "Log in to save items to your wishlist.",
  expired: "Your session has expired. Please log in again.",
  confirm: "Account created. Please confirm it using the link we emailed you, then log in.",
  registered: "Account created. Please log in.",
};

export default async function LoginPage({ searchParams }) {
  if (await getCustomer()) redirect("/account");
  const { expired, registered, wishlist } = await searchParams;
  const notice = expired ? NOTICES.expired : registered === "confirm" ? NOTICES.confirm : registered ? NOTICES.registered : wishlist ? NOTICES.wishlist : null;

  return (
    <section className="container flex justify-center py-12 md:py-20">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-semibold text-black md:text-[2rem]">Log in</h1>
        {notice && <p role="status" className="mb-4 rounded bg-surface px-3 py-2 text-sm text-ink">{notice}</p>}
        <ActionForm action={login}>
          <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <div className="flex items-center justify-between gap-4">
            <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
            <Link href="/forgot-password" className="text-sm text-ink underline underline-offset-4">Forgot password?</Link>
          </div>
        </ActionForm>
        <p className="mt-8 border-t border-line pt-6 text-sm text-ink">
          New here? <Link href="/register" className="font-semibold text-black underline underline-offset-4">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
