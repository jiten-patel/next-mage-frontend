"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
];

const ITEM = "block whitespace-nowrap rounded px-3 py-2 text-sm font-medium text-ink hover:bg-surface";

export default function AccountNav() {
  const path = usePathname();
  const isActive = (href) => (href === "/account" ? path === href : path.startsWith(href));

  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={`${ITEM} aria-[current=page]:bg-black aria-[current=page]:text-white`}>
          {label}
        </Link>
      ))}
      <form action={logout}>
        <button type="submit" className={`${ITEM} w-full text-left`}>Logout</button>
      </form>
    </nav>
  );
}
