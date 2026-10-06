import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-actions";
import { ActionForm, Field, SubmitButton } from "@/components/form";

export const metadata = { title: "Forgot password" };

// ponytail: the reset link in Magento's email opens Magento's own reset page; add a /reset-password page
// (resetPassword mutation) once the email template points at this storefront.
export default function ForgotPasswordPage() {
  return (
    <section className="container flex justify-center py-12 md:py-20">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-semibold text-black md:text-[2rem]">Forgot password</h1>
        <p className="mb-6 text-sm text-muted">Enter your email and we&apos;ll send you a link to reset your password.</p>
        <ActionForm action={requestPasswordReset}>
          <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus />
          <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
        </ActionForm>
        <p className="mt-8 border-t border-line pt-6 text-sm text-ink">
          <Link href="/login" className="font-semibold text-black underline underline-offset-4">Back to log in</Link>
        </p>
      </div>
    </section>
  );
}
