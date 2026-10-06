import Link from "next/link";
import { customerQuery } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 10;
const ORDERS = `query ($page: Int!) {
  customer {
    orders(currentPage: $page, pageSize: ${PAGE_SIZE}, sort: { sort_field: CREATED_AT, sort_direction: DESC }) {
      items { number order_date status total { grand_total { value currency } } }
      page_info { current_page total_pages }
    }
  }
}`;

const CELL = "px-4 py-3 text-left";

export default async function OrdersPage({ searchParams }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { customer: { orders } } = await customerQuery(ORDERS, { page });
  const { items, page_info: { total_pages } } = orders;

  return (
    <>
      <Breadcrumbs items={[{ label: "My account", href: "/account" }, { label: "Orders" }]} />
      <h1 className="mb-6 text-2xl font-semibold text-black md:text-[2rem]">Orders</h1>
      {!items.length ? (
        <p className="text-sm text-muted">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-surface text-xs uppercase text-muted">
              <tr>
                <th className={CELL}>Order #</th>
                <th className={CELL}>Date</th>
                <th className={CELL}>Status</th>
                <th className={CELL}>Total</th>
                <th className={CELL}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {items.map((o) => (
                <tr key={o.number}>
                  <td className={`${CELL} font-semibold text-black`}>{o.number}</td>
                  <td className={CELL}>{formatDate(o.order_date)}</td>
                  <td className={CELL}>{o.status}</td>
                  <td className={CELL}>{formatPrice(o.total.grand_total)}</td>
                  <td className={`${CELL} text-right`}>
                    <Link href={`/account/orders/${encodeURIComponent(o.number)}`} className="font-semibold text-black underline underline-offset-4">
                      View<span className="sr-only"> order {o.number}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total_pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={`?page=${page - 1}`} className="font-semibold underline underline-offset-4">Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {total_pages}</span>
          {page < total_pages ? <Link href={`?page=${page + 1}`} className="font-semibold underline underline-offset-4">Next</Link> : <span />}
        </nav>
      )}
    </>
  );
}
