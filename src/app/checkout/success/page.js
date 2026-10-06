import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth";

export const metadata = { title: "Order confirmed" };

// Only echoes the number from the redirect; order details live behind /account/orders (customers only).
export default async function CheckoutSuccessPage({ searchParams }) {
  const { order } = await searchParams;
  if (!order || !/^[\w-]{1,32}$/.test(order)) redirect("/");
  const customer = await getCustomer().catch(() => null);

  return (
    <section className="container py-16 text-center md:py-24">
      <h1 className="mb-3 text-2xl font-semibold text-black md:text-[2rem]">Thank you for your order!</h1>
      <p className="mb-2 text-ink">Your order number is <strong className="text-black">#{order}</strong>.</p>
      <p className="mb-8 text-sm text-muted">We&apos;ll email you an order confirmation with details and tracking info.</p>
      <div className="flex flex-wrap justify-center gap-4">
        {customer && (
          <Link href={`/account/orders/${order}`} className="rounded-full border border-black px-6 py-2.5 text-sm font-semibold text-black hover:bg-surface">View order</Link>
        )}
        <Link href="/" className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink">Continue shopping</Link>
      </div>
    </section>
  );
}
