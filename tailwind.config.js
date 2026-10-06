/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-raleway)", "Arial", "sans-serif"],
      },
      colors: {
        ink: "#333",
        muted: "#666",
        subtle: "#777",
        line: "#eee",
        "line-dark": "#444",
        "footer-link": "#ccc",
        surface: "#f5f5f5",
        "surface-alt": "#fafafa",
        card: "#f2f2f2",
      },
      boxShadow: {
        nav: "0 2px 5px rgba(0, 0, 0, 0.1)",
        menu: "0 4px 12px rgba(0, 0, 0, 0.1)",
        pill: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
      // Every `transition` class: a soft ease-out instead of Tailwind's snappy 150ms default.
      transitionDuration: { DEFAULT: "250ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0.22, 1, 0.36, 1)" },
      keyframes: {
        marquee: { to: { transform: "translateX(-50%)" } },
        "fade-in": { from: { opacity: "0" } },
        dropdown: { from: { opacity: "0", transform: "translateY(-6px)" } },
        // Gentler than Tailwind's pulse (which dips to 50% opacity on a sharper curve).
        breathe: { "50%": { opacity: "0.55" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "fade-in": "fade-in 250ms cubic-bezier(0.22, 1, 0.36, 1)",
        dropdown: "dropdown 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        // Skeletons wait 150ms before fading in, so fast loads never flash a placeholder.
        skeleton: "fade-in 300ms ease-out 150ms backwards, breathe 1.8s ease-in-out 450ms infinite",
      },
    },
  },
  // Own `.container` in globals.css: the core one drops responsive padding when `screens` is overridden.
  corePlugins: { container: false },
  plugins: [],
};
