import { locales, type Locale } from "../i18n/config.ts";
import { cardLocale } from "../../../origyn_landing_page/src/seo/card-locale.ts";
import {
  CARD_WIDTH,
  CARD_HEIGHT,
} from "../../../origyn_landing_page/src/seo/pages.ts";
import type { DashboardPage } from "./pages.ts";

export const SITE_NAME = "ORIGYN Dashboard";
export type SiteUrls = { site: string; cards: string };
export const productionUrls: SiteUrls = {
  site: "https://dashboard.origyn.com",
  cards: "https://og.bity.com",
};
const ogLocales: Record<Locale, string> = {
  en: "en_US",
  ar: "ar_AR",
  bg: "bg_BG",
  bn: "bn_BD",
  cs: "cs_CZ",
  da: "da_DK",
  de: "de_DE",
  el: "el_GR",
  es: "es_ES",
  fi: "fi_FI",
  fr: "fr_FR",
  he: "he_IL",
  hi: "hi_IN",
  hr: "hr_HR",
  hu: "hu_HU",
  id: "id_ID",
  it: "it_IT",
  ja: "ja_JP",
  ko: "ko_KR",
  nl: "nl_NL",
  no: "nb_NO",
  pl: "pl_PL",
  pt: "pt_PT",
  "pt-BR": "pt_BR",
  ro: "ro_RO",
  ru: "ru_RU",
  sv: "sv_SE",
  sw: "sw_KE",
  th: "th_TH",
  tl: "tl_PH",
  tr: "tr_TR",
  uk: "uk_UA",
  ur: "ur_PK",
  vi: "vi_VN",
  zh: "zh_CN",
  "zh-TW": "zh_TW",
};

export const pageUrl = (site: string, locale: string, path: string) =>
  `${site.replace(/\/+$/, "")}/${locale}${path ? `/${path}` : ""}`;

export const metadata = ({
  page,
  locale,
  copy,
  urls = productionUrls,
  path = page.path,
  search = "",
}: {
  page: DashboardPage;
  locale: Locale;
  copy: (key: string) => string;
  urls?: SiteUrls;
  path?: string;
  search?: string;
}) => {
  // Only detail identifiers belong in a canonical URL; filters and tracking do not.
  const query = new URLSearchParams(search);
  const identity = new URLSearchParams();
  const identityKey = ["dashboard-neuron", "dashboard-proposal"].includes(
    page.id
  )
    ? "id"
    : null;
  if (identityKey && query.has(identityKey))
    identity.set(identityKey, query.get(identityKey) ?? "");
  const suffix = identity.size ? `?${identity}` : "";
  const canonical = pageUrl(urls.site, locale, path) + suffix;
  const parameterIndex = page.path
    .split("/")
    .reduce((last, part, index) => (part.startsWith(":") ? index : last), -1);
  const reference =
    identity.get("id") ||
    (parameterIndex >= 0 && !path.includes(":")
      ? path.split("/")[parameterIndex]
      : "");
  const title = `${copy(page.keys.title)}${reference ? ` · ${reference}` : ""} | ${SITE_NAME}`;
  const description = copy(page.keys.description);
  const image = `${urls.cards.replace(/\/+$/, "")}/${page.id === "dashboard-not-found" ? "dashboard-home" : page.id}/${cardLocale(locale)}.jpg`;
  const tags: Record<string, string> = {
    description,
    robots: page.indexable ? "index,follow" : "noindex,follow",
    "og:type": "website",
    "og:site_name": SITE_NAME,
    "og:locale": ogLocales[locale],
    "og:url": canonical,
    "og:title": title,
    "og:description": description,
    "og:image": image,
    "og:image:type": "image/jpeg",
    "og:image:width": String(CARD_WIDTH),
    "og:image:height": String(CARD_HEIGHT),
    "og:image:alt": copy(page.keys.imageAlt),
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": image,
    "twitter:image:alt": copy(page.keys.imageAlt),
  };
  const alternates = page.indexable
    ? [
        ...locales.map((language) => ({
          language,
          href: pageUrl(urls.site, language, path) + suffix,
        })),
        {
          language: "x-default",
          href: `${urls.site.replace(/\/+$/, "")}/${path}${suffix}`,
        },
      ]
    : [];
  return { title, description, image, canonical, tags, alternates };
};

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
export const headTags = (meta: ReturnType<typeof metadata>): string =>
  [
    `<title data-seo>${escapeHtml(meta.title)}</title>`,
    `<link data-seo rel="canonical" href="${escapeHtml(meta.canonical)}">`,
    ...meta.alternates.map(
      ({ language, href }) =>
        `<link data-seo rel="alternate" hreflang="${language}" href="${escapeHtml(href)}">`
    ),
    ...Object.entries(meta.tags).map(
      ([key, value]) =>
        `<meta data-seo ${key.startsWith("og:") ? "property" : "name"}="${key}" content="${escapeHtml(value)}">`
    ),
  ].join("\n");
