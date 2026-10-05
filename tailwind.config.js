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
      keyframes: {
        marquee: { to: { transform: "translateX(-50%)" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  // Own `.container` in globals.css: the core one drops responsive padding when `screens` is overridden.
  corePlugins: { container: false },
  plugins: [],
};
