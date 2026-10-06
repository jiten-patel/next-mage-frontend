"use client";

// Magento down or an unexpected response. Auth failures never land here: they redirect to /login first.
export default function AccountError({ reset }) {
  return (
    <div role="alert" className="rounded border border-line p-6">
      <h1 className="mb-2 text-xl font-semibold text-black">Unable to load your account</h1>
      <p className="mb-4 text-sm text-muted">The store service may be temporarily unavailable. Please try again in a moment.</p>
      <button type="button" onClick={reset} className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink">Try again</button>
    </div>
  );
}
