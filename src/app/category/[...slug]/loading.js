import { Bone, GridSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <Skeleton label="Loading products" className="container py-10 md:py-[60px]">
      <Bone className="mx-auto mb-8 h-8 w-56 md:mb-10 md:h-10" />
      <div className="mb-8 flex justify-center gap-4">
        {["w-16", "w-20", "w-14"].map((w) => <Bone key={w} className={`h-4 ${w}`} />)}
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="space-y-5">
          {["w-20", "w-24", "w-16", "w-20"].map((w, i) => <Bone key={i} className={`h-4 ${w}`} />)}
        </div>
        <div>
          <div className="mb-6 flex justify-between">
            <Bone className="h-4 w-24" />
            <Bone className="h-8 w-44" />
          </div>
          <GridSkeleton />
        </div>
      </div>
    </Skeleton>
  );
}
