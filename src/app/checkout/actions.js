"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyError } from "@/lib/auth";
import { cartMutation, forgetGuestCart, getCheckout } from "@/lib/cart";
import { MagentoError } from "@/lib/magento";
import { addressValues, field, isEmail } from "@/lib/validate";
import { sameAddress } from "./address";

// Each section saves straight to Magento's cart; the page re-renders from the cart, so there's no client checkout state.
async function save(query, variables, fallback, values) {
  try {
    await cartMutation(query, variables);
  } catch (e) {
    return { error: friendlyError(e, fallback), values };
  }
  revalidatePath("/checkout");
  return {};
}

export async function saveEmail(_prev, formData) {
  const email = field(formData, "email");
  if (!isEmail(email)) return { fieldErrors: { email: "Enter a valid email address." }, values: { email } };
  return save(
    `mutation ($id: String!, $email: String!) { setGuestEmailOnCart(input: { cart_id: $id, email: $email }) { cart { email } } }`,
    { email },
    "We couldn't save your email. Please try again.",
    { email },
  );
}

// A saved customer address (customer_address_id) or the posted <AddressFields>.
function addressInput(formData) {
  const savedId = Number(formData.get("customer_address_id"));
  if (savedId) return { input: { customer_address_id: savedId } };
  const { values, fieldErrors } = addressValues(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };
  return {
    values,
    input: {
      address: {
        firstname: values.firstname,
        lastname: values.lastname,
        company: values.company,
        street: [values.street0, values.street1].filter(Boolean),
        city: values.city,
        postcode: values.postcode,
        country_code: values.country_code,
        telephone: values.telephone,
        ...(values.region_id ? { region_id: Number(values.region_id) } : { region: values.region }),
      },
    },
  };
}

export async function saveShippingAddress(_prev, formData) {
  const { input, fieldErrors, values } = addressInput(formData);
  if (fieldErrors) return { fieldErrors, values };

  // Billing follows shipping unless the shopper already chose a different billing address.
  const cart = await getCheckout();
  const billing = cart?.billing_address;
  const followBilling = !billing?.firstname || sameAddress(billing, cart.shipping_addresses?.[0]);
  return save(
    `mutation ($id: String!, $address: ShippingAddressInput!) {
      setShippingAddressesOnCart(input: { cart_id: $id, shipping_addresses: [$address] }) { cart { total_quantity } }
      ${followBilling ? "setBillingAddressOnCart(input: { cart_id: $id, billing_address: { same_as_shipping: true } }) { cart { total_quantity } }" : ""}
    }`,
    { address: input },
    "We couldn't save this address. Please check the details and try again.",
    values,
  );
}

export async function saveBillingAddress(_prev, formData) {
  const same = formData.get("same_as_shipping");
  const { input, fieldErrors, values } = same ? { input: { same_as_shipping: true } } : addressInput(formData);
  if (fieldErrors) return { fieldErrors, values };
  return save(
    `mutation ($id: String!, $address: BillingAddressInput!) { setBillingAddressOnCart(input: { cart_id: $id, billing_address: $address }) { cart { total_quantity } } }`,
    { address: input },
    "We couldn't save this address. Please check the details and try again.",
    values,
  );
}

export async function saveShippingMethod(_prev, formData) {
  const [carrier_code, method_code] = field(formData, "shipping_method").split("|");
  if (!carrier_code || !method_code) return { error: "Choose a shipping method." };
  return save(
    `mutation ($id: String!, $method: ShippingMethodInput!) { setShippingMethodsOnCart(input: { cart_id: $id, shipping_methods: [$method] }) { cart { total_quantity } } }`,
    { method: { carrier_code, method_code } },
    "We couldn't use this shipping method. Please choose another.",
  );
}

// ponytail: offline methods only (code alone). Gateways like Braintree/PayPal need their client SDK + nonce; add per gateway.
export async function savePaymentMethod(_prev, formData) {
  const code = field(formData, "payment_method");
  if (!code) return { error: "Choose a payment method." };
  return save(
    `mutation ($id: String!, $code: String!) { setPaymentMethodOnCart(input: { cart_id: $id, payment_method: { code: $code } }) { cart { total_quantity } } }`,
    { code },
    "We couldn't use this payment method. Please choose another.",
  );
}

export async function placeOrder() {
  let number;
  try {
    const { placeOrder: result } = await cartMutation(
      `mutation ($id: String!) { placeOrder(input: { cart_id: $id }) { errors { code message } orderV2 { number } } }`,
    );
    // Magento's place-order errors are written for shoppers (stock, missing address…), but still go through the filter.
    if (result.errors?.length) return { error: friendlyError(new MagentoError(result.errors[0].message, "graphql-input"), "We couldn't place your order.") };
    number = result.orderV2.number;
  } catch (e) {
    return { error: friendlyError(e, "We couldn't place your order. Please review your details and try again.") };
  }
  await forgetGuestCart();
  revalidatePath("/cart");
  redirect(`/checkout/success?order=${encodeURIComponent(number)}`);
}
