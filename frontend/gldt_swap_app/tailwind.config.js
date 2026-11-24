import Preset from "./src/theme/preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [Preset],
  darkMode: "media",
  // The GLDT app (src/app) is styled by its own kit, not Tailwind.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "!./src/app/**/*",
  ],
  plugins: [],
};
