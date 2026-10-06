import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "My account" };

const CARDS = [
  { href: "/account/profile", label: "Profile", text: "View and update your name and email." },
  { href: "/account/addresses", label: "Addresses", text: "Manage your saved shipping and billing addresses." },
  { href: "/account/orders", label: "Orders", text: "Track and review your past orders." },
  { href: "/account/wishlist", label: "Wishlist", text: "Products you've saved for later." },
];

export default async function AccountPage() {
  const customer = await requireCustomer();

  return (
    <>
      <Breadcrumbs items={[{ label: "My account" }]} />
      <h1 className="mb-1 text-2xl font-semibold text-black md:text-[2rem]">My account</h1>
      <p className="mb-8 text-sm text-muted">Welcome, {customer.firstname}</p>
      <h2 className="mb-4 text-lg font-semibold text-black">Account overview</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map(({ href, label, text }) => (
          <Link key={href} href={href} className="rounded border border-line p-5 transition hover:border-black">
            <span className="block font-semibold text-black">{label}</span>
            <span className="text-sm text-muted">{text}</span>
          </Link>
        ))}
        <div className="rounded border border-line p-5">
          <span className="block font-semibold text-black">Signed in as</span>
          <span className="break-all text-sm text-muted">{customer.email}</span>
        </div>
      </div>
    </>
  );
}
