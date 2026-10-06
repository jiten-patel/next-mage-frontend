// Inline stroke icons (24px grid, currentColor) so no icon library is needed.
const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  heart: <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />,
  cart: <><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  truck: <><path d="M2 5h12v11H2zM14 9h4l4 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  returns: <path d="M4 9a8 8 0 0 1 14-3l2 2M20 4v4h-4M20 15a8 8 0 0 1-14 3l-2-2M4 20v-4h4" />,
  support: <><path d="M12 7v5l3 2" /><path d="M21 12a9 9 0 1 1-3-6.7M21 3v5h-5" /></>,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" /></>,
  x: <path d="M4 4h4l12 16h-4zM20 4l-6.5 7.2M4 20l6.5-7.2" />,
  facebook: <path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z" />,
};

export default function Icon({ name, className = "size-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[name]}
    </svg>
  );
}

// Busy indicator in the current text colour (black on light UI, white inside black buttons).
export function Spinner({ className = "size-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`animate-spin motion-reduce:[animation-duration:2s] ${className}`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
