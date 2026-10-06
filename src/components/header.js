import Image from "next/image";
import Link from "next/link";
import { gql } from "@/lib/magento";
import { getCustomer } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { getCart } from "@/lib/cart";
import { getWishlist } from "@/lib/wishlist";
import MiniCart from "./mini-cart";
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
    "absolute left-0 top-full z-10 hidden min-w-[180px] animate-dropdown bg-white py-2 shadow-menu",
    "absolute left-full top-0 z-10 hidden min-w-[180px] animate-dropdown bg-white py-2 shadow-menu",
  ],
  mobile: [
    "absolute inset-x-0 top-full z-20 max-h-[70vh] animate-dropdown overflow-y-auto bg-white px-4 py-2 shadow-menu",
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
  // Session resolved server-side so the header never flickers from Login to Account after hydration.
  // Magento down → render without a menu so pages (e.g. login) can still show their own friendly error.
  const [root, customer, cart, wishlist] = await Promise.all([
    gql(MENU).then((d) => d.categoryList[0], () => null),
    getCustomer().catch(() => null),
    getCart().catch(() => null),
    getWishlist().catch(() => null), // no request for guests; shared with the product page via cache()
  ]);
  const wishlistCount = wishlist?.items.length ?? 0;

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
            <MenuList items={root?.children} variant="mobile" />
          </MobileMenu>
          <Link href="/">
            <Image src="/Stepozo.png" width={113} height={30} alt="Stepozo" priority />
          </Link>
        </div>
        <MenuList items={root?.children} variant="desktop" />
        <div className="flex items-center gap-4">
          {/* ponytail: search is visual only until a /search page exists. */}
          <label className="hidden items-center gap-2 rounded-full border border-ink px-3 py-1 sm:flex">
            <Icon name="search" className="size-4" />
            <input type="search" placeholder="Search" aria-label="Search" className="w-24 bg-transparent text-xs outline-none" />
          </label>
          <Link href="/account/wishlist" aria-label={`Wishlist, ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}`} className="relative">
            <Icon name="heart" />
            {wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 grid min-w-4 place-items-center rounded-full bg-black px-1 text-[10px] font-semibold leading-4 text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          {/* Same hover/focus dropdown as the desktop menu; the icon itself still links somewhere useful on touch. */}
          <div className={`flex ${ITEM_CLASSES.desktop}`}>
            <Link href={customer ? "/account" : "/login"} aria-label={customer ? "Account" : "Login"}>
              <Icon name="user" />
            </Link>
            <ul className="absolute right-0 top-full z-10 hidden min-w-[180px] animate-dropdown bg-white py-2 shadow-menu">
              {customer ? (
                <>
                  <li className="px-4 pb-1.5 pt-1 text-xs text-muted">Hi, {customer.firstname}</li>
                  <li><Link href="/account" className={linkClasses("desktop", 1)}>My account</Link></li>
                  <li><Link href="/account/orders" className={linkClasses("desktop", 1)}>Orders</Link></li>
                  <li>
                    <form action={logout}>
                      <button type="submit" className={`w-full text-left ${linkClasses("desktop", 1)}`}>Logout</button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li><Link href="/login" className={linkClasses("desktop", 1)}>Login</Link></li>
                  <li><Link href="/register" className={linkClasses("desktop", 1)}>Register</Link></li>
                </>
              )}
            </ul>
          </div>
          <MiniCart cart={cart} />
        </div>
      </nav>
    </header>
  );
}
