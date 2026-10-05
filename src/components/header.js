import Image from "next/image";
import Link from "next/link";
import { gql } from "@/lib/magento";
import MobileMenu from "./mobile-menu";
import Icon from "./icon";

// GraphQL can't recurse, so nest one level per depth. ponytail: 3 levels, add a level here if the tree grows deeper.
const FIELDS = "uid name url_path include_in_menu";
const MENU = `{ categoryList { children { ${FIELDS} children { ${FIELDS} children { ${FIELDS} } } } } }`;

const ANNOUNCEMENT = "Free standard shipping on orders over $80";

// Desktop: horizontal bar with hover/focus dropdowns. Mobile: one indented list in a slide-down panel.
const LIST_CLASSES = {
  desktop: [
    "hidden gap-7 lg:flex",
    "absolute left-0 top-full z-10 hidden min-w-[180px] bg-white py-2 shadow-menu",
    "absolute left-full top-0 z-10 hidden min-w-[180px] bg-white py-2 shadow-menu",
  ],
  mobile: [
    "absolute inset-x-0 top-full z-20 max-h-[70vh] overflow-y-auto bg-white px-4 py-2 shadow-menu",
    "pl-4",
    "pl-4",
  ],
};

const ITEM_CLASSES = {
  desktop: "relative [&:focus-within>ul]:block [&:hover>ul]:block",
  mobile: "",
};

function linkClasses(variant, depth) {
  if (variant === "mobile") return "block py-1.5 font-medium text-ink";
  return depth
    ? "block whitespace-nowrap px-4 py-1.5 text-sm font-medium text-ink hover:bg-surface"
    : "flex items-center gap-1 py-2 text-sm font-medium text-ink hover:text-black hover:underline underline-offset-4";
}

function MenuList({ items, variant, depth = 0 }) {
  const visible = items?.filter((c) => c.include_in_menu) ?? [];
  if (!visible.length) return null;

  return (
    <ul className={LIST_CLASSES[variant][Math.min(depth, 2)]}>
      {visible.map((c) => (
        <li key={c.uid} className={ITEM_CLASSES[variant]}>
          <Link href={`/category/${c.url_path}`} className={linkClasses(variant, depth)}>
            {c.name}
            {variant === "desktop" && !depth && c.children?.some((k) => k.include_in_menu) && (
              <Icon name="chevron" className="size-3.5" />
            )}
          </Link>
          <MenuList items={c.children} variant={variant} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

export default async function Header() {
  const { categoryList: [root] } = await gql(MENU);

  return (
    <header>
      {/* Duplicated run + translate(-50%) gives a seamless loop. */}
      <div className="overflow-hidden bg-black py-1.5 text-[11px] text-white">
        <div className="flex w-max animate-marquee motion-reduce:animate-none">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className="px-12" aria-hidden={i > 0}>{ANNOUNCEMENT}</span>
          ))}
        </div>
      </div>
      <nav className="container relative flex items-center justify-between gap-4 bg-white py-4 shadow-nav lg:shadow-none">
        <div className="flex items-center gap-4">
          <MobileMenu>
            <MenuList items={root.children} variant="mobile" />
          </MobileMenu>
          <Link href="/">
            <Image src="/Stepozo.png" width={113} height={30} alt="Stepozo" priority />
          </Link>
        </div>
        <MenuList items={root.children} variant="desktop" />
        <div className="flex items-center gap-4">
          {/* ponytail: search is visual only until a /search page exists. */}
          <label className="hidden items-center gap-2 rounded-full border border-ink px-3 py-1 sm:flex">
            <Icon name="search" className="size-4" />
            <input type="search" placeholder="Search" aria-label="Search" className="w-24 bg-transparent text-xs outline-none" />
          </label>
          <button type="button" aria-label="Wishlist"><Icon name="heart" /></button>
          <button type="button" aria-label="Cart"><Icon name="cart" /></button>
          <button type="button" aria-label="Account"><Icon name="user" /></button>
        </div>
      </nav>
    </header>
  );
}
