import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { applyCoupon, removeCoupon, updateCartItem } from "@/lib/cart-actions";
import { ActionForm, Field, INPUT, SubmitButton } from "./form";

// SubmitButton restyled as an underlined text link.
export const LINK_BUTTON = "!bg-transparent !px-0 !py-0 !font-normal !text-black underline underline-offset-4";

// Shared by the mini-cart (client) and the /cart page (server): plain markup, no server-only imports.

function itemOptions(item) {
  return [
    ...(item.configurable_options?.map((o) => [o.option_label, o.value_label]) ?? []),
    ...(item.bundle_options?.map((o) => [o.label, o.values.map((v) => `${v.quantity} × ${v.label}`).join(", ")]) ?? []),
    ...(item.links?.length ? [["Links", item.links.map((l) => l.title).join(", ")]] : []),
  ];
}

/** One cart line; `editable` adds the quantity field (cart page), otherwise just Remove (mini-cart). */
export function CartLine({ item, editable = false }) {
  const image = item.configured_variant?.small_image ?? item.product.small_image;
  const problem = !item.is_available ? item.not_available_message : item.errors?.[0]?.message;

  return (
    <li className="flex gap-4 py-4">
      {image?.url && (
        <Image src={image.url} alt={image.label || item.product.name} width={80} height={80} className="size-20 shrink-0 rounded-md bg-card object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-3">
          <Link href={`/product/${item.product.url_key}`} className="font-medium text-black hover:underline">{item.product.name}</Link>
          <span className="shrink-0 font-semibold text-black">{formatPrice(item.prices.row_total)}</span>
        </div>
        <dl className="mt-1 text-xs text-muted">
          {itemOptions(item).map(([label, value]) => (
            <div key={label}><dt className="inline">{label}: </dt><dd className="inline">{value}</dd></div>
          ))}
          {!editable && <div><dt className="inline">Qty: </dt><dd className="inline">{item.quantity}</dd></div>}
        </dl>
        {editable && <p className="mt-1 text-xs text-subtle">{formatPrice(item.prices.price)} each</p>}
        {problem && <p className="mt-1 text-xs text-red-700">{problem}</p>}

        <ActionForm action={updateCartItem} className="mt-2 flex flex-wrap items-center gap-3 [&>p]:w-full">
          <input type="hidden" name="uid" value={item.uid} />
          {editable && (
            <>
              <label className="flex items-center gap-2 text-sm">
                Qty
                <input type="number" name="quantity" min={1} max={10000} required defaultValue={item.quantity} className={`${INPUT} w-20`} />
              </label>
              <SubmitButton name="update" value="1" pendingText="Updating…" className="px-4 py-1.5 text-xs">Update</SubmitButton>
            </>
          )}
          {/* formNoValidate: removing shouldn't be blocked by an invalid quantity. */}
          <SubmitButton name="remove" value="1" formNoValidate pendingText="Removing…" className="!bg-transparent !px-0 !py-0 !text-xs !font-normal !text-muted underline underline-offset-4 hover:!text-black">
            Remove<span className="sr-only"> {item.product.name}</span>
          </SubmitButton>
        </ActionForm>
      </div>
    </li>
  );
}

/** `shipping`: the selected shipping method (checkout); without it shipping is "calculated at checkout". */
export function CartTotals({ prices, shipping }) {
  const row = (label, money, sign = "") => (
    <div key={label} className="flex justify-between gap-4 py-1">
      <dt>{label}</dt>
      <dd>{sign}{formatPrice(money)}</dd>
    </div>
  );
  return (
    <>
      <dl className="text-sm text-ink">
        {row("Subtotal", prices.subtotal_excluding_tax)}
        {prices.discounts?.map((d) => row(d.label || "Discount", d.amount, "−"))}
        {shipping && row(`Shipping (${shipping.carrier_title})`, shipping.amount)}
        {prices.applied_taxes.map((t) => row(t.label || "Tax", t.amount))}
        <div className="mt-2 flex justify-between gap-4 border-t border-line pt-3 text-base font-semibold text-black">
          <dt>Total</dt>
          <dd>{formatPrice(prices.grand_total)}</dd>
        </div>
      </dl>
      {!shipping && <p className="mt-1 text-xs text-muted">Shipping is calculated at checkout.</p>}
    </>
  );
}

export function CouponForm({ coupons }) {
  const applied = coupons?.[0]?.code;
  return applied ? (
    <ActionForm action={removeCoupon} className="flex flex-wrap items-center justify-between gap-2 text-sm [&>p]:w-full">
      <span>Coupon <strong className="text-black">{applied}</strong> applied</span>
      <SubmitButton pendingText="Removing…" className={LINK_BUTTON}>Remove</SubmitButton>
    </ActionForm>
  ) : (
    <ActionForm action={applyCoupon} className="flex items-end gap-2 [&>p]:w-full">
      <Field label="Coupon code" name="coupon_code" autoComplete="off" className="flex-1" />
      <SubmitButton pendingText="Applying…" className="mb-px">Apply</SubmitButton>
    </ActionForm>
  );
}
