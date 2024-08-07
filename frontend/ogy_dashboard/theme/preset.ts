export const colors = {
  background: "rgb(var(--color-background))",
  content: "rgb(var(--color-content))",
  surface: {
    1: "rgb(var(--color-surface-1))",
    2: "rgb(var(--color-surface-2))",
    3: "rgb(var(--color-surface-3))",
    DEFAULT: "rgb(var(--color-surface-1))",
  },
  border: "rgb(var(--color-border))",
  accent: "rgb(var(--color-accent))",
  charcoal: "rgb(var(--color-charcoal))",
  spacePurple: "rgb(var(--color-space-purple))",
  jade: "rgb(var(--color-jade))",
  sky: "rgb(var(--color-sky))",
  mouse: "rgb(var(--color-mouse))",
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
      backgroundImage: {
        'ledger-switch': "url('/bg_ledger_switch.jpg')",
      }
    },
  },
  plugins: [
    import("@tailwindcss/typography"),
    import("@tailwindcss/aspect-ratio"),
    import("@tailwindcss/line-clamp")
  ],
};
