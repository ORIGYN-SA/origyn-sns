// Per-page SEO copy and social-card content, read at build time by meta.ts and
// og-image.ts and at runtime by usePageTitle. To cover a page, add an entry whose
// `path` matches one of the PAGE_PATHS in vite.config.js; pages with no entry keep
// the site-wide tags from index.html. Bundled into the app, so no Node imports.

export const SITE_NAME = "ORIGYN";

// Only en.json carries the `dpp` catalog, so every locale serves the same
// English copy and points its canonical at the English URL rather than reading
// as a near-duplicate.
export const CANONICAL_LOCALE = "en";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

export const pages = [
  {
    path: "dpp",
    title: "EU Digital Product Passports",
    description:
      "ORIGYN turns EU DPP compliance from a multi-year engineering project into a plug & play rollout. Every passport is tamper-proof, traceable and always available.",
    // og:image:alt, so the card is not a blank tile for screen readers.
    imageAlt:
      "An ORIGYN digital product passport for a battery pack, open on a phone and a tablet.",
    card: {
      eyebrow: "Regulation (EU) 2024/1781",
      // "\n" splits lines; the last one renders in the brand gradient.
      title: "EU Digital\nProduct Passports",
      lead: "Compliance in weeks, not 18–36 months. Tamper-proof, traceable and always available.",
      // PNG in ./assets, bleeding off the card's right edge.
      art: { file: "dpp-passport-devices.png", width: 600, top: 76, right: -56 },
    },
  },
];

export type PageSeo = (typeof pages)[number];

export const ogImagePath = (page: PageSeo): string => `/og/${page.path}.png`;
