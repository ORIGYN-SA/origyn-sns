// Which pages get SEO tags and a social card, and which catalog strings they
// are built from. Read at build time by meta.ts and og-image.ts, and at runtime
// by usePageTitle. To cover a page, add an entry whose `path` matches one of the
// PAGE_PATHS in vite.config.js; pages with no entry keep the site-wide tags from
// index.html. Bundled into the app, so no Node imports.

export const SITE_NAME = "ORIGYN";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

export type PageSeo = {
  path: string;
  /** Dot-paths into the message catalogs, so every locale gets its own copy. */
  keys: {
    title: string;
    description: string;
    imageAlt: string;
    /** "\n" splits the card headline; the last line renders in the gradient. */
    cardTitle: string;
    cardLead: string;
  };
  /** PNG in ./assets, bleeding off the card's right edge. */
  art: { file: string; width: number; top: number; right: number };
};

export const pages: PageSeo[] = [
  {
    path: "dpp",
    keys: {
      title: "dpp.seo.title",
      description: "dpp.hero.lead",
      imageAlt: "dpp.hero.imageAlt",
      cardTitle: "dpp.hero.title",
      cardLead: "dpp.hero.lead",
    },
    art: { file: "dpp-passport-devices.png", width: 600, top: 76, right: -56 },
  },
];

export const ogImagePath = (page: PageSeo, locale: string): string =>
  `/og/${locale}/${page.path}.png`;
