"use client";

// Catches failures the segment boundaries can't (e.g. the account layout's session check while Magento is down).
export default function Error({ reset }) {
  return (
    <section role="alert" className="container py-16 text-center md:py-24">
      <h1 className="mb-2 text-2xl font-semibold text-black">Something went wrong</h1>
      <p className="mb-6 text-sm text-muted">The store service may be temporarily unavailable. Please try again in a moment.</p>
      <button type="button" onClick={reset} className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink">Try again</button>
    </section>
  );
}
