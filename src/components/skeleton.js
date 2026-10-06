import { GRID } from "./product-grid";

// Page-load placeholders (loading.js), same grey blocks + pulse as the account loader.
export function Bone({ className = "" }) {
  return <div className={`rounded bg-surface ${className}`} />;
}

export function Skeleton({ label = "Loading", className = "", children }) {
  return (
    <div role="status" aria-label={label} className={`animate-skeleton ${className}`}>
      {children}
    </div>
  );
}

// Mirrors ProductCard: grey square, name left, price right.
export function GridSkeleton({ count = 8 }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-square bg-card" />
          <div className="flex justify-between gap-2 pt-3">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CartLineSkeleton() {
  return (
    <div className="flex gap-4 py-4">
      <div className="size-20 shrink-0 rounded-md bg-card" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between gap-3">
          <Bone className="h-4 w-1/2" />
          <Bone className="h-4 w-16" />
        </div>
        <Bone className="h-3 w-1/3" />
        <Bone className="h-8 w-40" />
      </div>
    </div>
  );
}

export function SummarySkeleton({ rows = 3 }) {
  return (
    <div className="h-fit space-y-4 rounded-md border border-line p-5">
      <Bone className="h-6 w-36" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex justify-between">
          <Bone className="h-4 w-24" />
          <Bone className="h-4 w-16" />
        </div>
      ))}
      <Bone className="h-11 w-full rounded-full" />
    </div>
  );
}
