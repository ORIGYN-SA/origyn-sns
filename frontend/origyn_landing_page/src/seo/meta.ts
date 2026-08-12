// Turns a `pages.ts` entry into the <head> tags of one emitted index.html.
// Social crawlers do not run the SPA, so whatever the asset canister serves is
// all they ever see, which makes these tags build-time output.

import { locales, type Locale } from "../i18n/config.ts";
import { copy } from "./copy.ts";
import { cardLocale } from "./og-image.ts";
import { CARD_HEIGHT, CARD_WIDTH, ogImagePath, SITE_NAME, type PageSeo } from "./pages.ts";

// og:locale wants language_TERRITORY, which does not follow from the locale tag
// on its own, so the territories are spelled out.
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

const buildTags = (page: PageSeo, locale: Locale, siteUrl: string): string => {
  const canonical = `${siteUrl}/${locale}/${page.path}`;

  // X reads og:title, og:description and og:image, so twitter:card is the only
  // tag it needs of its own.
  const tags: Record<string, string> = {
    "og:type": "website",
    "og:site_name": SITE_NAME,
    "og:locale": OG_LOCALES[locale],
    "og:url": canonical,
    "og:title": copy(locale, page.keys.title),
    "og:description": copy(locale, page.keys.description),
    "og:image": `${siteUrl}${ogImagePath(page, cardLocale(locale))}`,
    "og:image:type": "image/png",
    "og:image:width": String(CARD_WIDTH),
    "og:image:height": String(CARD_HEIGHT),
    "og:image:alt": copy(locale, page.keys.imageAlt),
    "twitter:card": "summary_large_image",
  };

  // Every locale serves the same page in its own language, so each one points
  // at the others; x-default is the unprefixed path, which negotiates a locale
  // client-side and redirects.
  const alternates = [
    ...locales.map(
      (alternate) =>
        `<link rel="alternate" hreflang="${alternate}" href="${escape(`${siteUrl}/${alternate}/${page.path}`)}">`
    ),
    `<link rel="alternate" hreflang="x-default" href="${escape(`${siteUrl}/${page.path}`)}">`,
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

/**
 * Rewrite the site-wide title and description of a built index.html with the
 * page's own, then add its social tags. Throws rather than emitting a page that
 * silently keeps the generic tags, since nothing downstream would catch that.
 */
export const injectHead = (
  html: string,
  page: PageSeo,
  locale: Locale,
  siteUrl: string
): string => {
  const title = `${copy(locale, page.keys.title)} | ${SITE_NAME}`;
  const edits: [RegExp, string][] = [
    [/<title>[\s\S]*?<\/title>/i, `<title>${escape(title)}</title>`],
    [
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${escape(copy(locale, page.keys.description))}">`,
    ],
    [/[ \t]*<\/head>/i, `${buildTags(page, locale, siteUrl)}\n  </head>`],
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
