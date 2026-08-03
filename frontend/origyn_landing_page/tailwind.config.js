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
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(270deg, #1F9CD4 3%, #1470B1 30%, #1A5EA2 36%, #214B92 44%, #254088 53%, #263C85 63%, #25397E 69%, #223169 79%, #1E2448 90%, #1E2345 91%)",
        // The main ramp ends at #1E2345, which is invisible against navy.
        "brand-gradient-bright":
          "linear-gradient(90deg, #6FD6F5 0%, #1F9CD4 45%, #2E7BC4 100%)",
        // Stops at #1F9CD4 to keep navy label text at AA (5.6:1); the -bright
        // tail drops to 4.2:1.
        "brand-gradient-cta":
          "linear-gradient(90deg, #6FD6F5 0%, #1F9CD4 100%)",
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
