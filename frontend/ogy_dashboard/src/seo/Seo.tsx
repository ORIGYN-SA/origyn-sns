import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLocale } from "../i18n/LocaleContext";
import { splitLocalePath } from "../i18n/paths";
import { headTags, metadata, productionUrls } from "./meta";
import { matchPage } from "./pages";

export default function Seo() {
  const { locale, t } = useLocale();
  const { pathname, search } = useLocation();
  useEffect(() => {
    const { rest } = splitLocalePath(pathname);
    const path = rest.replace(/\/+$/, "");
    const meta = metadata({
      page: matchPage(path),
      locale,
      copy: t,
      path,
      search,
      urls: {
        site: import.meta.env.VITE_SITE_URL || productionUrls.site,
        cards: import.meta.env.VITE_OG_IMAGE_BASE_URL || productionUrls.cards,
      },
    });
    document.head
      .querySelectorAll('[data-seo], title, meta[name="description"]')
      .forEach((node) => node.remove());
    document.head.insertAdjacentHTML("beforeend", headTags(meta));
    return () => {
      document.head
        .querySelectorAll("[data-seo]")
        .forEach((node) => node.remove());
    };
  }, [locale, t, pathname, search]);
  return null;
}
