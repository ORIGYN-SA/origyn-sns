// Turns a `pages.ts` entry into the <head> tags of one emitted index.html.
// Social crawlers do not run the SPA, so whatever the asset canister serves is
// all they ever see, which makes these tags build-time output.

import {
  CANONICAL_LOCALE,
  CARD_HEIGHT,
  CARD_WIDTH,
  ogImagePath,
  SITE_NAME,
  type PageSeo,
} from "./pages.ts";

const escape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildTags = (page: PageSeo, siteUrl: string): string => {
  const canonical = `${siteUrl}/${CANONICAL_LOCALE}/${page.path}`;

  // X reads og:title, og:description and og:image, so twitter:card is the only
  // tag it needs of its own.
  const tags: Record<string, string> = {
    "og:type": "website",
    "og:site_name": SITE_NAME,
    "og:locale": "en_US",
    "og:url": canonical,
    "og:title": page.title,
    "og:description": page.description,
    "og:image": `${siteUrl}${ogImagePath(page)}`,
    "og:image:type": "image/png",
    "og:image:width": String(CARD_WIDTH),
    "og:image:height": String(CARD_HEIGHT),
    "og:image:alt": page.imageAlt,
    "twitter:card": "summary_large_image",
  };

  return [
    `<link rel="canonical" href="${escape(canonical)}">`,
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
export const injectHead = (html: string, page: PageSeo, siteUrl: string): string => {
  const edits: [RegExp, string][] = [
    [/<title>[\s\S]*?<\/title>/i, `<title>${escape(`${page.title} | ${SITE_NAME}`)}</title>`],
    [
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${escape(page.description)}">`,
    ],
    [/[ \t]*<\/head>/i, `${buildTags(page, siteUrl)}\n  </head>`],
  ];

  return edits.reduce((current, [pattern, replacement]) => {
    if (!pattern.test(current)) {
      throw new Error(
        `index.html has no ${pattern} to replace for /${page.path}; update src/seo/meta.ts to match it.`
      );
    }
    return current.replace(pattern, replacement);
  }, html);
};
