"use server";

import { redirect } from "next/navigation";
import { gql } from "./magento";
import { endSession, friendlyError, getPasswordPolicy, startSession } from "./auth";
import { mergeGuestCart } from "./cart";
import { field, isEmail, missing, passwordError } from "./validate";

// Passwords are never logged, echoed back in `values`, or stored: they go straight to Magento.

const TOKEN = `mutation ($email: String!, $password: String!) { generateCustomerToken(email: $email, password: $password) { token } }`;
// Not asking for confirmation_status: Magento's resolver for it errors on guest requests ("customerId = 0").
const CREATE = `mutation ($input: CustomerCreateInput!) { createCustomerV2(input: $input) { customer { email } } }`;

async function signIn(email, password) {
  const { generateCustomerToken } = await gql(TOKEN, { email, password }, { noStore: true });
  await startSession(generateCustomerToken.token);
  await mergeGuestCart(generateCustomerToken.token);
}

export async function login(_prev, formData) {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  const values = { email };

  const fieldErrors = missing({ email, password }, { email: "Email", password: "Password" });
  if (email && !isEmail(email)) fieldErrors.email = "Enter a valid email address.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  try {
    await signIn(email, password);
  } catch (e) {
    if (e.category !== "graphql-authentication") return { error: friendlyError(e), values };
    return {
      error: /confirm/i.test(e.message)
        ? "Please confirm your account using the link we emailed you, then log in."
        : "Invalid email or password, or the account is temporarily locked.",
      values,
    };
  }
  redirect("/account");
}

export async function register(_prev, formData) {
  const values = { firstname: field(formData, "firstname"), lastname: field(formData, "lastname"), email: field(formData, "email") };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fieldErrors = missing({ ...values, password }, { firstname: "First name", lastname: "Last name", email: "Email", password: "Password" });
  if (values.email && !isEmail(values.email)) fieldErrors.email = "Enter a valid email address.";
  if (password && !fieldErrors.password) {
    const error = passwordError(password, await getPasswordPolicy().catch(() => ({ minLength: 8, classes: 0 })));
    if (error) fieldErrors.password = error;
  }
  if (password && confirm !== password) fieldErrors.confirm = "Passwords don't match.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  try {
    await gql(CREATE, { input: { ...values, password } }, { noStore: true });
  } catch (e) {
    if (/same email address already exists/i.test(e.message)) return { fieldErrors: { email: "An account with this email already exists." }, values };
    return { error: friendlyError(e, "We couldn't create your account. Please try again."), values };
  }

  // Account exists now. If sign-in fails (email confirmation required, or a hiccup), send them to log in
  // rather than showing a retry that would hit "email exists".
  const failure = await signIn(values.email, password).then(() => null, (e) => e);
  redirect(!failure ? "/account" : /confirm/i.test(failure.message) ? "/login?registered=confirm" : "/login?registered=1");
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function requestPasswordReset(_prev, formData) {
  const email = field(formData, "email");
  if (!isEmail(email)) return { fieldErrors: { email: "Enter a valid email address." }, values: { email } };

  try {
    await gql(`mutation ($email: String!) { requestPasswordResetEmail(email: $email) }`, { email }, { noStore: true });
  } catch (e) {
    // Other errors (e.g. unknown email) get the same answer as success, so this can't probe which emails have accounts.
    if (e.category === "unavailable") return { error: friendlyError(e), values: { email } };
  }
  return { success: "If an account exists for that email, we've sent a link to reset your password." };
}
