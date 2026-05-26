// Tailwind preset exposing the design tokens the shared components rely on.
// The color values are driven by CSS variables (see tokens.css) so the same
// utility classes (text-content, bg-surface, text-muted, etc.) resolve in
// both the dashboard and the landing page. Mirrors ogy_dashboard/theme/preset.ts.
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
  muted: "rgb(var(--color-muted))",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tailwindcssColors = (input: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {};
  Object.keys(input).forEach((key) => {
    if (typeof input[key] === "object") {
      out[key] = tailwindcssColors(input[key]);
    } else if (typeof input[key] === "string") {
      out[key] = input[key].replace(/\)$/, " / <alpha-value>)");
    }
  });
  return out;
};

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: tailwindcssColors(colors),
    },
  },
};
