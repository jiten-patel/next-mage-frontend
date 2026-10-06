import { Bone, CartLineSkeleton, Skeleton, SummarySkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <Skeleton label="Loading cart" className="container py-10 md:py-16">
      <Bone className="mb-6 h-8 w-56 md:h-10" />
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-line border-y border-line">
          {Array.from({ length: 3 }, (_, i) => <CartLineSkeleton key={i} />)}
        </div>
        <SummarySkeleton />
      </div>
    </Skeleton>
  );
}
