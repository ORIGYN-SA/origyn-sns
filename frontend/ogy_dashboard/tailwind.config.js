import Preset from "./theme/preset";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [Preset],
  darkMode: "media",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // @origyn/shared-ui is hoisted to the monorepo root node_modules
    "../../node_modules/@origyn/shared-ui/dist/**/*.js",
    "./node_modules/@origyn/shared-ui/dist/**/*.js",
  ],
  plugins: [forms],
};
