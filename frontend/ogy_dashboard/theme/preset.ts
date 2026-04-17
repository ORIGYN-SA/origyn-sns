export const colors = {
  background: "rgb(var(--color-background))",
  content: "rgb(var(--color-content))",
  surface: {
    1: "rgb(var(--color-surface-1))",
    2: "rgb(var(--color-surface-2))",
    3: "rgb(var(--color-surface-3))",
    muted: "rgb(var(--color-surface-muted))",
    faint: "rgb(var(--color-surface-faint))",
    DEFAULT: "rgb(var(--color-surface-1))",
  },
  border: {
    DEFAULT: "rgb(var(--color-border))",
    strong: "rgb(var(--color-border-strong))",
    faint: "rgb(var(--color-border-faint))",
  },
  accent: "rgb(var(--color-accent))",
  charcoal: "rgb(var(--color-charcoal))",
  charcoalLight: "rgb(var(--color-charcoal-light))",
  charcoal2: "rgb(var(--color-charcoal-2))",
  spacePurple: "rgb(var(--color-space-purple))",
  jade: "rgb(var(--color-jade))",
  sky: "rgb(var(--color-sky))",
  mouse: "rgb(var(--color-mouse))",
  muted: "rgb(var(--color-muted))",
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
