import { Bone, Skeleton } from "@/components/skeleton";

// Mirrors ProductView: gallery left, details + Add to cart right.
export default function Loading() {
  return (
    <Skeleton label="Loading product" className="grid gap-10 px-5 py-10 md:px-[50px] md:py-[60px] lg:grid-cols-2">
      <div>
        <div className="aspect-square rounded-[10px] bg-card" />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="aspect-square rounded-md bg-surface" />)}
        </div>
      </div>
      <div>
        <Bone className="mb-3 h-9 w-3/4 md:h-10" />
        <Bone className="mb-5 h-4 w-32" />
        <Bone className="mb-5 h-8 w-28" />
        <Bone className="mb-6 h-4 w-20" />
        <div className="mb-6 space-y-2">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <Bone className="h-4 w-2/3" />
        </div>
        <div className="mb-6 flex gap-3">
          {Array.from({ length: 4 }, (_, i) => <Bone key={i} className="h-9 w-12" />)}
        </div>
        <div className="flex gap-4">
          <Bone className="h-12 w-28" />
          <div className="h-12 w-44 rounded-[10px] bg-surface" />
        </div>
      </div>
    </Skeleton>
  );
}
