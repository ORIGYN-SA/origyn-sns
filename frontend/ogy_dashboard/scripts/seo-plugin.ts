import type { Plugin } from "vite";
import { locales, dirFor } from "../src/i18n/config.ts";
import { copy } from "../src/seo/copy.ts";
import {
  headTags,
  metadata,
  productionUrls,
  pageUrl,
  escapeHtml,
} from "../src/seo/meta.ts";
import { pages } from "../src/seo/pages.ts";

export const seoPlugin = (): Plugin => {
  let urls = productionUrls;
  return {
    name: "dashboard-seo",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      urls = {
        site: (config.env.VITE_SITE_URL || productionUrls.site).replace(
          /\/+$/,
          ""
        ),
        cards: (
          config.env.VITE_OG_IMAGE_BASE_URL || productionUrls.cards
        ).replace(/\/+$/, ""),
      };
    },
    generateBundle(_options, bundle) {
      const entry = bundle["index.html"];
      if (!entry || entry.type !== "asset" || typeof entry.source !== "string")
        throw new Error("Missing dashboard index.html");
      const template = entry.source.replace(/<title>[\s\S]*?<\/title>/i, "");
      for (const page of pages.filter((item) => !item.path.includes(":"))) {
        for (const locale of locales) {
          const html = template
            .replace(
              '<html lang="en">',
              `<html lang="${locale}" dir="${dirFor(locale)}">`
            )
            .replace(
              "</head>",
              `${headTags(metadata({ page, locale, copy: (key) => copy(locale, key), urls }))}\n</head>`
            );
          this.emitFile({
            type: "asset",
            fileName: `${locale}${page.path ? `/${page.path}` : ""}/index.html`,
            source: html,
          });
          if (locale === "en") {
            if (page.path)
              this.emitFile({
                type: "asset",
                fileName: `${page.path}/index.html`,
                source: html,
              });
            else entry.source = html;
          }
        }
      }
      const entries = pages.filter(
        (page) => page.indexable && !page.path.includes(":")
      );
      const sitemap = entries.flatMap((page) =>
        locales.map(
          (locale) =>
            `<url><loc>${escapeHtml(pageUrl(urls.site, locale, page.path))}</loc></url>`
        )
      );
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap.join("")}</urlset>`,
      });
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *\nAllow: /\nSitemap: ${urls.site}/sitemap.xml\n`,
      });
    },
  };
};
