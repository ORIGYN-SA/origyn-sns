import sharedPreset from "../shared/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  // The shared calculator's design tokens (content/surface{,-2,-faint}/border/
  // muted) come from this preset, backed by the CSS variables in
  // shared/src/tokens.css (imported in main.jsx). Its light-mode values
  // match the landing's previous `surface`/`muted` hex, so existing usages are
  // unchanged while the calculator gains the extra surface/border shades.
  presets: [sharedPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../shared/src/**/*.{ts,tsx}",
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
