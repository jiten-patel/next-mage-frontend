"use client";

import { usePathname } from "next/navigation";
import Icon from "./icon";

// Native <details> toggle; keying on the path remounts it closed after each navigation.
export default function MobileMenu({ children }) {
  return (
    <details key={usePathname()} className="group lg:hidden">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden" aria-label="Menu">
        <Icon name="menu" className="size-6 group-open:hidden" />
        <Icon name="close" className="hidden size-6 group-open:block" />
      </summary>
      {children}
    </details>
  );
}
