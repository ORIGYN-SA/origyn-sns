export const colors = {
  background: {
    DEFAULT: "rgb(var(--color-background-1))",
  },
  surface: {
    1: "rgb(var(--color-surface-1))",
    2: "rgb(var(--color-surface-2))",
    3: "rgb(var(--color-surface-3))",
    DEFAULT: "rgb(var(--color-surface-1))",
  },
  content: {
    DEFAULT: "rgb(var(--color-content-1))",
  },
  accent: "rgb(var(--color-accent))",
  charcoal: "rgb(var(--color-charcoal))",
  spacePurple: "rgb(var(--color-space-purple))",
  jade: "rgb(var(--color-jade))",
  sky: "rgb(var(--color-sky))",
  candyFloss: "rgb(var(--color-candy-floss))",
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
    import("@tailwindcss/typography"),
    import("@tailwindcss/aspect-ratio"),
  ],
};
