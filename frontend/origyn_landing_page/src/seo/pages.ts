// What each page says about itself, for meta.ts, usePageTitle and og-worker.
// Bundled into the app, so it must stay free of Node imports.

export const SITE_NAME = "ORIGYN";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;
/** Shared so a local preview matches what the worker serves. */
export const CARD_QUALITY = 85;

export type InsetArt = { file: string; width: number; top: number; right: number };

// split: text left, artwork inset right. feature: full-bleed photograph under
// a scrim. type: no photograph, concentric rings instead.
export type PageCard =
  | { layout: "split"; art: InsetArt }
  | { layout: "feature"; art: { file: string } }
  | { layout: "type" };

export type PageSeo = {
  /** Route below the locale prefix. "" is the home page. */
  path: string;
  /** Card id, since `path` can contain slashes and a URL segment cannot. */
  id: string;
  keys: {
    title: string;
    description: string;
    imageAlt: string;
    cardTitle: string;
    cardLead: string;
  };
  card: PageCard;
};

// Keys pointing outside `seo` reuse copy the page already shows, which is
// already translated. Only what the page has no equivalent for lives in `seo`.
export const pages: PageSeo[] = [
  {
    path: "",
    id: "home",
    keys: {
      title: "seo.home.title",
      description: "seo.home.description",
      imageAlt: "seo.home.imageAlt",
      cardTitle: "home.hero.subtitleMobile",
      cardLead: "seo.home.description",
    },
    card: {
      layout: "split",
      art: { file: "home-dashboard.png", width: 580, top: 104, right: -76 },
    },
  },
  {
    path: "ai",
    id: "ai",
    keys: {
      title: "seo.ai.title",
      description: "seo.ai.description",
      imageAlt: "seo.ai.imageAlt",
      cardTitle: "hero.title",
      cardLead: "seo.ai.description",
    },
    card: { layout: "type" },
  },
  {
    path: "dpp",
    id: "dpp",
    keys: {
      title: "dpp.seo.title",
      description: "dpp.hero.lead",
      imageAlt: "dpp.hero.imageAlt",
      cardTitle: "dpp.hero.title",
      cardLead: "dpp.hero.lead",
    },
    card: {
      layout: "split",
      art: { file: "dpp-passport-devices.png", width: 600, top: 76, right: -56 },
    },
  },
  {
    path: "token",
    id: "token",
    keys: {
      title: "seo.token.title",
      description: "seo.token.description",
      imageAlt: "seo.token.imageAlt",
      cardTitle: "seo.token.cardTitle",
      cardLead: "seo.token.description",
    },
    card: {
      layout: "split",
      art: { file: "token-sphere.png", width: 430, top: 62, right: 18 },
    },
  },
  {
    path: "help-center",
    id: "help-center",
    keys: {
      title: "seo.helpCenter.title",
      description: "seo.helpCenter.description",
      imageAlt: "seo.helpCenter.imageAlt",
      cardTitle: "seo.helpCenter.cardTitle",
      cardLead: "seo.helpCenter.description",
    },
    card: { layout: "type" },
  },
  {
    path: "integrator",
    id: "integrator",
    keys: {
      title: "seo.integrator.title",
      description: "seo.integrator.description",
      imageAlt: "seo.integrator.imageAlt",
      cardTitle: "seo.integrator.cardTitle",
      cardLead: "seo.integrator.description",
    },
    card: { layout: "feature", art: { file: "integrator.jpg" } },
  },
  {
    path: "integrator/join",
    id: "integrator-join",
    keys: {
      title: "seo.integratorJoin.title",
      description: "seo.integratorJoin.description",
      imageAlt: "seo.integratorJoin.imageAlt",
      cardTitle: "seo.integratorJoin.cardTitle",
      cardLead: "seo.integratorJoin.description",
    },
    card: { layout: "type" },
  },
  // Order matters: `home.useCases.items` lists the same four in the same order,
  // and that is where each card's one-liner comes from.
  ...(["art", "gold", "luxury", "madein"] as const).map(
    (slug, index): PageSeo => ({
      path: `use-case/${slug}`,
      id: `use-case-${slug}`,
      keys: {
        title: `seo.useCase.${slug}.title`,
        description: `seo.useCase.${slug}.description`,
        imageAlt: `seo.useCase.${slug}.imageAlt`,
        // The page opens on the bare noun, which is the headline we want.
        cardTitle: `useCase.cases.${slug}.0.title`,
        cardLead: `home.useCases.items.${index}.description`,
      },
      card: { layout: "feature", art: { file: `use-case-${slug}.jpg` } },
    })
  ),
];

export const pageById = (id: string): PageSeo | undefined =>
  pages.find((page) => page.id === id);

export const cardPath = (page: PageSeo, locale: string): string =>
  `/${page.id}/${locale}.jpg`;
