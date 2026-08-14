// Turns a `pages.ts` entry into the <head> of one emitted index.html. Crawlers
// never run the SPA, so these tags have to be build-time output.

import { locales, type Locale } from "../i18n/config.ts";
import { cardLocale } from "./card.ts";
import { copy } from "./copy.ts";
import { cardPath, CARD_HEIGHT, CARD_WIDTH, SITE_NAME, type PageSeo } from "./pages.ts";

// og:locale wants language_TERRITORY, which the locale tag alone does not give.
const OG_LOCALES: Record<Locale, string> = {
  en: "en_US", ar: "ar_AR", bg: "bg_BG", bn: "bn_BD", cs: "cs_CZ", da: "da_DK",
  de: "de_DE", el: "el_GR", es: "es_ES", fi: "fi_FI", fr: "fr_FR", he: "he_IL",
  hi: "hi_IN", hr: "hr_HR", hu: "hu_HU", id: "id_ID", it: "it_IT", ja: "ja_JP",
  ko: "ko_KR", nl: "nl_NL", no: "nb_NO", pl: "pl_PL", pt: "pt_PT", "pt-BR": "pt_BR",
  ro: "ro_RO", ru: "ru_RU", sv: "sv_SE", sw: "sw_KE", th: "th_TH", tl: "tl_PH",
  tr: "tr_TR", uk: "uk_UA", ur: "ur_PK", vi: "vi_VN", zh: "zh_CN", "zh-TW": "zh_TW",
};

const escape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const pageUrl = (siteUrl: string, locale: Locale, page: PageSeo): string =>
  page.path ? `${siteUrl}/${locale}/${page.path}` : `${siteUrl}/${locale}`;

const buildTags = (page: PageSeo, locale: Locale, urls: SiteUrls): string => {
  const canonical = pageUrl(urls.site, locale, page);

  // X reads the og: tags, so twitter:card is the only one it needs of its own.
  const tags: Record<string, string> = {
    "og:type": "website",
    "og:site_name": SITE_NAME,
    "og:locale": OG_LOCALES[locale],
    "og:url": canonical,
    "og:title": copy(locale, page.keys.title),
    "og:description": copy(locale, page.keys.description),
    // Another origin: og-worker draws these rather than the canister storing them.
    "og:image": `${urls.cards}${cardPath(page, cardLocale(locale))}`,
    "og:image:type": "image/jpeg",
    "og:image:width": String(CARD_WIDTH),
    "og:image:height": String(CARD_HEIGHT),
    "og:image:alt": copy(locale, page.keys.imageAlt),
    "twitter:card": "summary_large_image",
  };

  // x-default is the unprefixed path, which negotiates a locale client-side.
  const alternates = [
    ...locales.map(
      (alternate) =>
        `<link rel="alternate" hreflang="${alternate}" href="${escape(pageUrl(urls.site, alternate, page))}">`
    ),
    `<link rel="alternate" hreflang="x-default" href="${escape(`${urls.site}/${page.path}`)}">`,
  ];

  return [
    `<link rel="canonical" href="${escape(canonical)}">`,
    ...alternates,
    ...Object.entries(tags).map(
      ([key, content]) =>
        `<meta ${key.startsWith("og:") ? "property" : "name"}="${key}" content="${escape(content)}">`
    ),
  ]
    .map((tag) => `    ${tag}`)
    .join("\n");
};

export type SiteUrls = { site: string; cards: string };

/** Throws rather than emitting a page that silently keeps the generic tags. */
export const injectHead = (
  html: string,
  page: PageSeo,
  locale: Locale,
  urls: SiteUrls
): string => {
  const title = `${copy(locale, page.keys.title)} | ${SITE_NAME}`;
  const edits: [RegExp, string][] = [
    [/<title>[\s\S]*?<\/title>/i, `<title>${escape(title)}</title>`],
    [
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${escape(copy(locale, page.keys.description))}">`,
    ],
    [/[ \t]*<\/head>/i, `${buildTags(page, locale, urls)}\n  </head>`],
  ];

  return edits.reduce((current, [pattern, replacement]) => {
    if (!pattern.test(current)) {
      throw new Error(
        `index.html has no ${pattern} to replace for /${locale}/${page.path}; update src/seo/meta.ts to match it.`
      );
    }
    return current.replace(pattern, replacement);
  }, html);
};
