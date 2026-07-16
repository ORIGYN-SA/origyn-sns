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
const tailwindcssColors = (colors: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatedColors: any = {};
  Object.keys(colors).forEach((key) => {
    if (typeof colors[key] === "object") {
      updatedColors[key] = tailwindcssColors(colors[key]);
    } else if (typeof colors[key] === "string") {
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
        sans: ["DM sans", "system-ui", "sans-serif"],
      },
      maxHeight: {
        "dialog-template": "92vh",
        dialog: "90vh",
      },
      height: {
        "explorer-tile": "343px",
        "explorer-collection-tile": "326px",
        "explorer-tile-image": "229px",
        "explorer-hero": "360px",
        "explorer-certificate-image": "320px",
        "explorer-certificate-image-sm": "380px",
        "certificate-skeleton": "420px",
        "certificate-skeleton-sm": "560px",
        "collection-summary": "140px",
        "collection-logo": "120px",
        "no-image-icon": "30%",
      },
      maxWidth: {
        page: "1440px",
        certificate: "1200px",
        "explorer-heading": "528px",
        "certificate-skeleton-pill": "280px",
      },
      width: {
        "explorer-tile": "253px",
        "explorer-hero": "min(85vw, 520px)",
        "explorer-hero-sm": "640px",
        "collection-logo": "120px",
      },
      fontSize: {
        "explorer-heading": ["40px", { lineHeight: "44px" }],
        "explorer-heading-sm": ["64px", { lineHeight: "60px" }],
        "explorer-section": ["22px", { lineHeight: "1" }],
        "explorer-label": ["10px", { lineHeight: "1" }],
        "explorer-meta": ["11px", { lineHeight: "1rem" }],
        "explorer-link-detail": ["13px", { lineHeight: "1" }],
        "explorer-card-title": ["15px", { lineHeight: "1.375" }],
        "explorer-hero-title": ["26px", { lineHeight: "1.25" }],
        "explorer-hero-title-sm": ["30px", { lineHeight: "1.25" }],
      },
      letterSpacing: {
        "explorer-meta": "1.6px",
        "explorer-fine": "2px",
        "explorer-hero": "-0.02em",
        "explorer-heading": "-0.05em",
      },
      scale: {
        103: "1.03",
      },
      boxShadow: {
        "ogy-badge":
          "inset 0.75px 0.75px 0 rgba(255, 255, 255, 0.45), inset -0.75px -0.75px 0 rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.18)",
      },
      backgroundImage: {
        "ledger-switch": "url('/bg_ledger_switch.webp')",
      },
    },
  },
  plugins: [
    import("@tailwindcss/typography"),
    import("@tailwindcss/aspect-ratio"),
    import("@tailwindcss/line-clamp"),
  ],
};
