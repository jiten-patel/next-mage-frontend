import Link from "next/link";

// Home › …items; the last item is the current page (rendered without a link).
export default function Breadcrumbs({ items, className = "mb-6" }) {
  const trail = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={`text-left text-xs text-ink ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {trail.map(({ label, href }, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {last || !href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "font-semibold text-black" : ""}>{label}</span>
              ) : (
                <Link href={href} className="hover:text-black hover:underline">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
