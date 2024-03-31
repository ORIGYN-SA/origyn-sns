export const colors = {
  background: {
    1: "rgb(var(--color-background-1))",
    3: "rgb(var(--color-background-3))",
    DEFAULT: "rgb(var(--color-background-default))",
  },
  surface: {
    1: "rgb(var(--color-surface-1))",
    DEFAULT: "rgb(var(--color-surface-default))",
  },
  content: {
    DEFAULT: "rgb(var(--color-content-default))",
  },
  accent: "rgb(var(--color-accent))",
  charcoal: "rgb(var(--color-charcoal))",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tailwindcssColors = (colors:any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatedColors: any = {};
  Object.keys(colors).forEach(key => {
    if (typeof colors[key] === 'object') {
      updatedColors[key] = tailwindcssColors(colors[key]);
    } else if (typeof colors[key] === 'string') {
      updatedColors[key] = colors[key].replace(/\)$/, " / <alpha-value>)");
    }
  });
  return updatedColors;
};

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: tailwindcssColors(colors),
      fontFamily: {
        sans: ["DM sans", "Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [
    // require("@tailwindcss/typography"),
    // require("@tailwindcss/aspect-ratio"),
  ],
};
