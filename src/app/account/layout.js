import { requireCustomer } from "@/lib/auth";
import AccountNav from "@/components/account-nav";

// Checked here (outside loading.js's Suspense) so a missing/expired session gets a real HTTP redirect
// before streaming. Pages still fetch through customerQuery, which guards the data on its own.
export default async function AccountLayout({ children }) {
  await requireCustomer();

  return (
    <section className="container py-10 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr] lg:gap-12">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
