import sharedPreset from "@origyn/shared-ui/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  // The shared components' design tokens (content/surface{,-2,-faint}/border/
  // muted) come from this preset, backed by the CSS variables in
  // @origyn/shared-ui/tokens.css (imported in main.jsx). Its light-mode values
  // match the landing's previous `surface`/`muted` hex, so existing usages are
  // unchanged while the shared UI gains the extra surface/border shades.
  presets: [sharedPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    // @origyn/shared-ui is hoisted to the monorepo root node_modules
    "../../node_modules/@origyn/shared-ui/dist/**/*.js",
    "./node_modules/@origyn/shared-ui/dist/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#222526",
        navy: "#061937",
        canvas: "#f5f4f4",
        hairline: "#e8e8e8",
      },
      fontFamily: {
        sans: ['"General Sans"', "system-ui", "sans-serif"],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      screens: {
        // v4 overrode the `lg` breakpoint to 990px via --breakpoint-lg.
        lg: "990px",
      },
    },
  },
  plugins: [],
};
