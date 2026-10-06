import { Bone, Skeleton, SummarySkeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <Skeleton label="Loading checkout" className="container py-10 md:py-16">
      <Bone className="mb-6 h-8 w-40 md:h-10" />
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-4 rounded-md border border-line p-5">
              <div className="flex items-center gap-3">
                <div className="size-7 rounded-full bg-surface" />
                <Bone className="h-5 w-40" />
              </div>
              <Bone className="h-10 w-full" />
              <Bone className="h-10 w-2/3" />
            </div>
          ))}
        </div>
        <SummarySkeleton rows={4} />
      </div>
    </Skeleton>
  );
}
