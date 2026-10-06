// Remounts on every navigation, so each new page fades in instead of snapping into place.
// Opacity only: a lingering transform would break position:fixed/sticky inside pages.
export default function Template({ children }) {
  return <div className="animate-fade-in">{children}</div>;
}
