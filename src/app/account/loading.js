export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-skeleton space-y-4">
      <div className="h-8 w-48 rounded bg-surface" />
      <div className="h-4 w-72 rounded bg-surface" />
      <div className="h-32 rounded bg-surface" />
    </div>
  );
}
