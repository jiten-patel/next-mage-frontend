import { useState } from "react";
import Image from "next/image";

export default function Gallery({ images, alt }) {
  const [active, setActive] = useState(0);
  const list = images.filter((i) => !i.disabled).sort((a, b) => a.position - b.position);

  if (!list.length) return <div className="aspect-square rounded-[10px] bg-surface" />;
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div>
      <Image
        key={current.url} // remount on swap so the fade replays
        src={current.url}
        alt={current.label || alt}
        width={700}
        height={700}
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="w-full animate-fade-in rounded-[10px] border border-line"
      />
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {list.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`overflow-hidden rounded-md border ${i === active ? "border-black" : "border-line"}`}
            >
              <Image src={image.url} alt="" width={120} height={120} className="w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
