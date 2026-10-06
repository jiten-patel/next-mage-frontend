"use client";

import { createContext, use, useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "./icon";

// Server actions return { error, success, fieldErrors, values }; fields read their slice from context.
export const FormState = createContext({});

export const INPUT = "w-full rounded border border-[#ccc] bg-white px-3 py-2 text-sm text-black outline-none focus:border-black aria-[invalid=true]:border-red-600";

// autoSubmit: save on every change (radio lists). There's no button to show progress, so the options dim and a
// "Saving…" line appears instead. Pair with a <noscript> submit button for no-JS.
export function ActionForm({ action, children, className = "space-y-4", autoSubmit = false }) {
  const [state, formAction, isPending] = useActionState(action, {});
  return (
    <FormState value={state}>
      <form action={formAction} aria-busy={isPending} className={className} onChange={autoSubmit ? (e) => e.currentTarget.requestSubmit() : undefined}>
        {state.error && <p role="alert" className="animate-fade-in rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="animate-fade-in rounded bg-green-50 px-3 py-2 text-sm text-green-800">{state.success}</p>}
        {autoSubmit ? <div className={isPending ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>{children}</div> : children}
        {autoSubmit && isPending && (
          <p role="status" className="flex animate-fade-in items-center gap-2 text-sm text-muted"><Spinner /> Saving…</p>
        )}
      </form>
    </FormState>
  );
}

// React resets forms after an action, so failed submissions echo `values` back as the new defaults.
export function Field({ label, name, defaultValue, hint, className = "", ...props }) {
  const { fieldErrors, values } = use(FormState);
  const id = useId();
  const error = fieldErrors?.[name];
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <input id={id} name={name} defaultValue={values?.[name] ?? defaultValue} aria-invalid={!!error} aria-describedby={describedBy} className={INPUT} {...props} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 animate-fade-in text-xs text-red-700">{error}</p>}
    </div>
  );
}

// With name/value (several submit buttons in one form), only the button that was pressed shows the spinner.
export function SubmitButton({ children, pendingText = "Please wait…", className = "", confirm, name, value, ...props }) {
  const { pending, data } = useFormStatus();
  const mine = pending && (!name || data?.get(name) === value);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={mine}
      {...props}
      onClick={confirm ? (e) => window.confirm(confirm) || e.preventDefault() : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {mine && <Spinner />}
      {mine ? pendingText : children}
    </button>
  );
}
