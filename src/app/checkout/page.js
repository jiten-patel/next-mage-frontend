import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { customerQuery, getCustomer } from "@/lib/auth";
import { getCheckout } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { ADDRESS_FIELDS, getCountries } from "@/lib/magento";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import AddressFields from "@/components/address-fields";
import { CartTotals, CouponForm, LINK_BUTTON } from "@/components/cart-lines";
import { AddressLines, sameAddress, toFormAddress } from "./address";
import { placeOrder, saveBillingAddress, saveEmail, savePaymentMethod, saveShippingAddress, saveShippingMethod } from "./actions";
import Breadcrumbs from "@/components/breadcrumbs";

export const metadata = { title: "Checkout" };

const CARD = "rounded-md border border-line p-5";
const OPTION = "flex cursor-pointer items-start gap-3 rounded border border-line p-4 has-[:checked]:border-black has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50";

function Section({ n, title, done, children }) {
  return (
    <section className={CARD} aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-4 flex items-center gap-3 text-lg font-semibold text-black">
        <span className={`grid size-7 place-items-center rounded-full text-sm ${done ? "bg-black text-white" : "border border-black"}`} aria-hidden="true">{done ? "✓" : n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// Inline when there's nothing yet, otherwise tucked behind a "Change" toggle under the current value.
function Editable({ open, label, children }) {
  if (open) return children;
  return (
    <details className="mt-3 group">
      <summary className="cursor-pointer text-sm text-black underline underline-offset-4">{label}</summary>
      <div className="mt-4 animate-dropdown">{children}</div>
    </details>
  );
}

// Customers pick a saved address or enter a new one; guests only get the form.
function AddressChooser({ action, saved, countries, current, submitLabel }) {
  const form = (
    <ActionForm action={action}>
      <AddressFields countries={countries} address={current} />
      <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
    </ActionForm>
  );
  if (!saved.length) return form;
  return (
    <div className="space-y-4">
      <ActionForm action={action}>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium text-ink">Saved addresses</legend>
          {saved.map((a) => (
            <label key={a.id} className={OPTION}>
              <input type="radio" name="customer_address_id" value={a.id} required className="mt-1 accent-black" />
              <AddressLines address={a} />
            </label>
          ))}
        </fieldset>
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </ActionForm>
      <Editable label="Use a new address">{form}</Editable>
    </div>
  );
}

// Radio lists save on change; <noscript> keeps a button for no-JS shoppers.
function MethodForm({ action, name, options, selected, buttonLabel }) {
  return (
    <ActionForm action={action} autoSubmit className="space-y-3">
      <fieldset className="grid gap-3">
        <legend className="sr-only">{buttonLabel}</legend>
        {options.map((o) => (
          <label key={o.value} className={OPTION}>
            <input type="radio" name={name} value={o.value} defaultChecked={o.value === selected} disabled={o.disabled} required className="mt-1 accent-black" />
            <span className="flex-1 text-sm">
              <span className="block font-medium text-black">{o.label}</span>
              {o.note && <span className="block text-xs text-muted">{o.note}</span>}
            </span>
            {o.price && <span className="text-sm font-semibold text-black">{o.price}</span>}
          </label>
        ))}
      </fieldset>
      <noscript><SubmitButton>{buttonLabel}</SubmitButton></noscript>
    </ActionForm>
  );
}

export default async function CheckoutPage() {
  const cart = await getCheckout();
  const items = cart?.itemsV2.items ?? [];
  if (!items.length) redirect("/cart");

  const customer = await getCustomer();
  const [countries, saved] = await Promise.all([
    getCountries(),
    customer ? customerQuery(`{ customer { addresses { ${ADDRESS_FIELDS} } } }`).then((d) => d.customer.addresses ?? []) : [],
  ]);

  const needsShipping = !cart.is_virtual;
  const shipping = cart.shipping_addresses?.[0]?.firstname ? cart.shipping_addresses[0] : null;
  const method = shipping?.selected_shipping_method;
  const billing = cart.billing_address?.firstname ? cart.billing_address : null;
  const billingIsShipping = needsShipping && sameAddress(billing, shipping);
  const payment = cart.selected_payment_method?.code;
  const unavailable = items.some((i) => !i.is_available);

  const missing = [
    !cart.email && "your email",
    needsShipping && !shipping && "a shipping address",
    needsShipping && shipping && !method && "a shipping method",
    !billing && "a billing address",
    !payment && "a payment method",
  ].filter(Boolean);
  const ready = !missing.length && !unavailable;
  let n = 0;

  return (
    <section className="container py-10 md:py-16">
      <Breadcrumbs items={[{ label: "Shopping cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mb-6 text-2xl font-semibold text-black md:text-[2rem]">Checkout</h1>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Section n={++n} title="Contact" done={!!cart.email}>
            {customer ? (
              <p className="text-sm text-ink">Signed in as <strong className="text-black">{cart.email}</strong></p>
            ) : (
              <>
                <ActionForm action={saveEmail} className="flex flex-wrap items-end gap-3 [&>p]:w-full">
                  <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={cart.email ?? ""} required className="min-w-56 flex-1" hint="Your order confirmation will be sent here." />
                  <SubmitButton pendingText="Saving…" className="mb-5">{cart.email ? "Update" : "Continue"}</SubmitButton>
                </ActionForm>
                <p className="mt-2 text-sm text-muted">
                  Have an account? <Link href="/login" className="text-black underline underline-offset-4">Log in</Link> — your cart comes with you.
                </p>
              </>
            )}
          </Section>

          {needsShipping && (
            <Section n={++n} title="Shipping address" done={!!shipping}>
              {shipping && <AddressLines address={shipping} />}
              <Editable open={!shipping} label="Change shipping address">
                <AddressChooser action={saveShippingAddress} saved={saved} countries={countries} current={toFormAddress(shipping)} submitLabel="Ship to this address" />
              </Editable>
            </Section>
          )}

          {needsShipping && (
            <Section n={++n} title="Shipping method" done={!!method}>
              {!shipping ? (
                <p className="text-sm text-muted">Enter your shipping address to see delivery options.</p>
              ) : !shipping.available_shipping_methods?.length ? (
                <p role="alert" className="text-sm text-red-700">We don&apos;t deliver to this address yet. Please try another address.</p>
              ) : (
                <MethodForm
                  action={saveShippingMethod}
                  name="shipping_method"
                  buttonLabel="Use this shipping method"
                  selected={method && `${method.carrier_code}|${method.method_code}`}
                  options={shipping.available_shipping_methods.map((m) => ({
                    value: `${m.carrier_code}|${m.method_code}`,
                    label: [m.carrier_title, m.method_title].filter(Boolean).join(" — "),
                    note: !m.available ? m.error_message || "Unavailable" : null,
                    price: m.available ? formatPrice(m.amount) : null,
                    disabled: !m.available,
                  }))}
                />
              )}
            </Section>
          )}

          <Section n={++n} title="Billing address" done={!!billing}>
            {billingIsShipping ? (
              <p className="text-sm text-ink">Same as shipping address</p>
            ) : billing ? (
              <>
                <AddressLines address={billing} />
                {shipping && (
                  <ActionForm action={saveBillingAddress} className="mt-3">
                    <input type="hidden" name="same_as_shipping" value="1" />
                    <SubmitButton pendingText="Saving…" className={LINK_BUTTON}>Use my shipping address instead</SubmitButton>
                  </ActionForm>
                )}
              </>
            ) : needsShipping ? (
              <p className="text-sm text-muted">Your billing address will match your shipping address.</p>
            ) : null}
            <Editable open={!billing && !needsShipping} label="Use a different billing address">
              <AddressChooser action={saveBillingAddress} saved={saved} countries={countries} current={billingIsShipping ? undefined : toFormAddress(billing)} submitLabel="Use this billing address" />
            </Editable>
          </Section>

          <Section n={++n} title="Payment method" done={!!payment}>
            {cart.available_payment_methods?.length ? (
              <MethodForm
                action={savePaymentMethod}
                name="payment_method"
                buttonLabel="Use this payment method"
                selected={payment}
                options={cart.available_payment_methods.map((m) => ({ value: m.code, label: m.title }))}
              />
            ) : (
              <p className="text-sm text-muted">Payment options appear once your delivery details are complete.</p>
            )}
          </Section>
        </div>

        <aside className={`${CARD} space-y-5 bg-surface lg:sticky lg:top-6`} aria-labelledby="summary-title">
          <div className="flex items-baseline justify-between">
            <h2 id="summary-title" className="text-lg font-semibold text-black">Order summary</h2>
            <Link href="/cart" className="text-sm text-black underline underline-offset-4">Edit cart</Link>
          </div>
          <ul className="divide-y divide-line">
            {items.map((item) => {
              const image = item.configured_variant?.small_image ?? item.product.small_image;
              return (
                <li key={item.uid} className="flex items-center gap-3 py-3 text-sm">
                  {image?.url && <Image src={image.url} alt="" width={48} height={48} className="size-12 rounded bg-card object-cover" />}
                  <span className="flex-1">
                    <span className="block text-black">{item.product.name}</span>
                    <span className="text-xs text-muted">Qty {item.quantity}</span>
                    {!item.is_available && <span className="block text-xs text-red-700">{item.not_available_message || "Unavailable"}</span>}
                  </span>
                  <span className="font-semibold text-black">{formatPrice(item.prices.row_total)}</span>
                </li>
              );
            })}
          </ul>
          <CouponForm coupons={cart.applied_coupons} />
          <div className="border-t border-line pt-4">
            <CartTotals prices={cart.prices} shipping={method} />
          </div>
          <ActionForm action={placeOrder} className="space-y-3">
            {ready ? (
              <SubmitButton pendingText="Placing order…" className="w-full py-3">Place order</SubmitButton>
            ) : (
              <>
                <button type="button" disabled className="w-full cursor-not-allowed rounded-full bg-black py-3 text-sm font-semibold text-white opacity-40">Place order</button>
                <p className="text-xs text-muted">
                  {unavailable ? "Some items in your cart are unavailable. Please update your cart." : `To place your order, add ${missing.join(", ")}.`}
                </p>
              </>
            )}
          </ActionForm>
        </aside>
      </div>
    </section>
  );
}
