import { notFound } from "next/navigation";
import { customerQuery } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import Breadcrumbs from "@/components/breadcrumbs";

const MONEY = "value currency";
const ADDRESS = "firstname lastname company street city region postcode country_code telephone";
// Payment: method name only; additional_data can hold card details and is never requested.
const ORDER = `query ($number: String!) {
  customer {
    orders(filter: { number: { eq: $number } }) {
      items {
        number order_date status shipping_method
        payment_methods { name }
        shipping_address { ${ADDRESS} }
        billing_address { ${ADDRESS} }
        items {
          id product_name product_sku quantity_ordered
          product_sale_price { ${MONEY} }
          prices { row_total { ${MONEY} } }
          selected_options { label value }
        }
        total {
          subtotal_excl_tax { ${MONEY} } total_shipping { ${MONEY} } total_tax { ${MONEY} } grand_total { ${MONEY} }
          discounts { label amount { ${MONEY} } }
        }
      }
    }
  }
}`;

export async function generateMetadata({ params }) {
  return { title: `Order #${decodeURIComponent((await params).number)}` };
}

function Address({ title, address }) {
  if (!address) return null;
  return (
    <div>
      <h2 className="mb-2 font-semibold text-black">{title}</h2>
      <address className="text-sm not-italic leading-6 text-ink">
        {address.firstname} {address.lastname}<br />
        {address.company && <>{address.company}<br /></>}
        {address.street?.map((s) => <span key={s}>{s}<br /></span>)}
        {[address.city, address.region, address.postcode].filter(Boolean).join(", ")}<br />
        {address.country_code}<br />
        {address.telephone}
      </address>
    </div>
  );
}

export default async function OrderPage({ params }) {
  const number = decodeURIComponent((await params).number);
  // Scoped to the logged-in customer by Magento, so another customer's order number just returns nothing.
  const { customer } = await customerQuery(ORDER, { number });
  const order = customer.orders.items[0];
  if (!order) notFound();
  const { total } = order;

  const totals = [
    ["Subtotal", total.subtotal_excl_tax],
    ...(total.discounts ?? []).map((d) => [d.label || "Discount", { ...d.amount, value: -d.amount.value }]),
    ["Shipping", total.total_shipping],
    ["Tax", total.total_tax],
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "My account", href: "/account" }, { label: "Orders", href: "/account/orders" }, { label: `Order #${order.number}` }]} />
      <h1 className="mb-1 text-2xl font-semibold text-black md:text-[2rem]">Order #{order.number}</h1>
      <p className="mb-8 text-sm text-muted">{formatDate(order.order_date)} · <span className="font-semibold text-ink">{order.status}</span></p>

      <div className="mb-8 overflow-x-auto rounded border border-line">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-black">{item.product_name}</span>
                  <span className="text-xs text-muted">SKU: {item.product_sku}</span>
                  {item.selected_options?.map((o) => <span key={o.label} className="block text-xs text-muted">{o.label}: {o.value}</span>)}
                </td>
                <td className="px-4 py-3 text-right">{formatPrice(item.product_sale_price)}</td>
                <td className="px-4 py-3 text-right">{item.quantity_ordered}</td>
                <td className="px-4 py-3 text-right">{formatPrice(item.prices.row_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="grid gap-8 sm:grid-cols-2">
          <Address title="Shipping address" address={order.shipping_address} />
          <Address title="Billing address" address={order.billing_address} />
          {order.shipping_method && (
            <div>
              <h2 className="mb-2 font-semibold text-black">Shipping method</h2>
              <p className="text-sm text-ink">{order.shipping_method}</p>
            </div>
          )}
          {!!order.payment_methods?.length && (
            <div>
              <h2 className="mb-2 font-semibold text-black">Payment method</h2>
              <p className="text-sm text-ink">{order.payment_methods.map((p) => p.name).join(", ")}</p>
            </div>
          )}
        </div>
        <dl className="h-fit space-y-2 rounded bg-surface p-5 text-sm">
          {totals.map(([label, money]) => (
            <div key={label} className="flex justify-between text-ink"><dt>{label}</dt><dd>{formatPrice(money)}</dd></div>
          ))}
          <div className="flex justify-between border-t border-line pt-2 font-semibold text-black"><dt>Grand total</dt><dd>{formatPrice(total.grand_total)}</dd></div>
        </dl>
      </div>
    </>
  );
}
