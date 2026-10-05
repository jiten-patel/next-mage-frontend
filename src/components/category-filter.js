"use client";

import { useState } from "react";
import { Card } from "./product-card";
import { GRID } from "./product-grid";

// Filter pills over a set of tiles; each tile lists the filters it belongs to in `tags`.
export default function CategoryFilter({ filters, tiles }) {
  const [active, setActive] = useState("All");
  const shown = active === "All" ? tiles : tiles.filter((t) => t.tags.includes(active));

  return (
    <>
      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {["All", ...filters].map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={active === f}
            onClick={() => setActive(f)}
            className="min-w-[110px] rounded border border-ink px-6 py-1.5 text-sm font-semibold text-black transition hover:bg-surface aria-pressed:bg-black aria-pressed:text-white"
          >
            {f}
          </button>
        ))}
      </div>
      <div className={GRID}>
        {shown.map((t) => <Card key={t.name} {...t} />)}
      </div>
    </>
  );
}
