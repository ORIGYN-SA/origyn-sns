/* eslint-disable no-undef */
// eslint-disable-next-line no-undef
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "hsla(var(--color-background), <alpha-value>)",
        surface: "hsla(var(--color-surface), <alpha-value>)",
        content: {
          light: "hsla(var(--color-content-light), <alpha-value>)",
          dark: "hsla(var(--color-content-dark), <alpha-value>)",
          DEFAULT: "hsla(var(--color-content), <alpha-value>)",
        },
        accent: "hsla(var(--color-accent), <alpha-value>)",
        charcoal: "hsla(var(--color-charcoal), <alpha-value>)",
      },
      fontFamily: {
        sans: ["DM sans", "Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
