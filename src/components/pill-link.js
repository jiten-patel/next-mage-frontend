import Link from "next/link";

// White rounded call-to-action used on the hero and banner tiles.
export default function PillLink({ href, children, className = "" }) {
  return (
    <Link href={href} className={`inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-black shadow-pill transition hover:bg-black hover:text-white ${className}`}>
      {children}
    </Link>
  );
}
