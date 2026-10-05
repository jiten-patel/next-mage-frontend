import Image from "next/image";
import Link from "next/link";
import Icon from "./icon";

const PAGE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/category/men", label: "Men" },
  { href: "/category/women", label: "Women" },
  { href: "/category/what-is-new", label: "Shop" },
  { href: "/category/sale", label: "Sale" },
];

const SUPPORT_LINKS = [
  { href: "/about", label: "About us" },
  { href: "#", label: "Contact us" },
  { href: "#", label: "FAQ" },
];

const SOCIAL_LINKS = [
  { href: "#", label: "Instagram", icon: "instagram" },
  { href: "#", label: "Twitter", icon: "x" },
  { href: "#", label: "Facebook", icon: "facebook" },
];

function LinkList({ title, links }) {
  return (
    <div>
      <h4 className="mb-4 font-medium">{title}</h4>
      <ul className="space-y-1.5">
        {links.map(({ href, label, icon }) => (
          <li key={label}>
            <Link href={href} className="flex items-center gap-2 text-xs text-footer-link hover:text-white">
              {icon && <Icon name={icon} className="size-4" />}
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <div className="container mt-16 md:mt-[110px]">
      <footer className="rounded-t-3xl bg-black px-6 pb-6 pt-10 text-white md:rounded-t-[40px] md:px-[80px] md:pt-[70px]">
        <div className="mb-10 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-md">
            <Image src="/Stepozo.png" width={150} height={38} alt="Stepozo" className="mb-6 invert" />
            <p className="mb-10 text-xs leading-relaxed text-footer-link">
              Step into style and comfort with Stepozo, where every stride tells a story. From sleek
              sneakers to sophisticated loafers, we offer a curated collection to elevate your
              footwear game.
            </p>
            <h4 className="font-medium">Get the latest offers early.</h4>
            <p className="mb-4 text-xs text-footer-link">Subscribe our newsletter</p>
            {/* ponytail: newsletter not wired to Magento yet (subscribeEmailToNewsletter mutation). */}
            <div className="flex rounded-full bg-white p-1">
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent px-4 text-xs text-black outline-none"
              />
              <button type="button" className="rounded-full bg-black px-6 py-2 text-xs font-semibold text-white">
                Send
              </button>
            </div>
          </div>
          <LinkList title="Pages" links={PAGE_LINKS} />
          <LinkList title="Support" links={SUPPORT_LINKS} />
          <LinkList title="Follow us now" links={SOCIAL_LINKS} />
        </div>
        <p className="border-t border-line-dark pt-5 text-center text-xs text-footer-link">
          Copyright © {new Date().getFullYear()} Stepozo.
        </p>
      </footer>
    </div>
  );
}
