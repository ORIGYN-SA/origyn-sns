/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#222526",
        muted: "#69737c",
        navy: "#061937",
        canvas: "#f5f4f4",
        surface: "#ffffff",
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
