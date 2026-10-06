"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customerQuery, friendlyError, isAuthError, requireCustomer } from "@/lib/auth";
import { addressValues, field, isEmail, missing } from "@/lib/validate";

const UPDATE_CUSTOMER = `mutation ($input: CustomerUpdateInput!) { updateCustomerV2(input: $input) { customer { firstname } } }`;
const UPDATE_EMAIL = `mutation ($email: String!, $password: String!) { updateCustomerEmail(email: $email, password: $password) { customer { email } } }`;

export async function updateProfile(_prev, formData) {
  const values = { firstname: field(formData, "firstname"), lastname: field(formData, "lastname"), email: field(formData, "email") };
  const password = String(formData.get("password") ?? "");

  const fieldErrors = missing(values, { firstname: "First name", lastname: "Last name", email: "Email" });
  if (values.email && !isEmail(values.email)) fieldErrors.email = "Enter a valid email address.";
  const current = await requireCustomer();
  const emailChanged = values.email.toLowerCase() !== current.email.toLowerCase();
  if (emailChanged && !password) fieldErrors.password = "Enter your current password to change your email.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  try {
    await customerQuery(UPDATE_CUSTOMER, { input: { firstname: values.firstname, lastname: values.lastname } });
    if (emailChanged) await customerQuery(UPDATE_EMAIL, { email: values.email, password });
  } catch (e) {
    // Session is known-good here (customerQuery re-checked it), so an auth error means the password was wrong.
    if (isAuthError(e)) return { fieldErrors: { password: "Incorrect password." }, values };
    if (/same email address already exists/i.test(e.message)) return { fieldErrors: { email: "An account with this email already exists." }, values };
    return { error: friendlyError(e, "We couldn't update your profile. Please try again."), values };
  }
  revalidatePath("/", "layout"); // header + account pages show the new name
  return { success: "Your profile has been updated.", values };
}

export async function saveAddress(id, _prev, formData) {
  const { values, fieldErrors } = addressValues(formData);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const input = {
    firstname: values.firstname,
    lastname: values.lastname,
    company: values.company,
    street: [values.street0, values.street1].filter(Boolean),
    city: values.city,
    region: values.region_id ? { region_id: Number(values.region_id) } : { region: values.region },
    postcode: values.postcode,
    country_code: values.country_code,
    telephone: values.telephone,
    default_shipping: formData.get("default_shipping") === "on",
    default_billing: formData.get("default_billing") === "on",
  };

  try {
    await (id
      ? customerQuery(`mutation ($id: Int!, $input: CustomerAddressInput!) { updateCustomerAddress(id: $id, input: $input) { id } }`, { id, input })
      : customerQuery(`mutation ($input: CustomerAddressInput!) { createCustomerAddress(input: $input) { id } }`, { input }));
  } catch (e) {
    return { error: friendlyError(e, "We couldn't save this address. Please check the details and try again."), values };
  }
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddress(id) {
  try {
    await customerQuery(`mutation ($id: Int!) { deleteCustomerAddress(id: $id) }`, { id });
  } catch (e) {
    return { error: friendlyError(e, "We couldn't delete this address. Please try again.") };
  }
  revalidatePath("/account/addresses");
  return {};
}
