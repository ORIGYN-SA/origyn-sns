import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getT } from "@/i18n";
import { splitLocalePath } from "@/i18n/paths";
import { pages, SITE_NAME } from "@/seo/pages";

// The served HTML carries the right <title> (src/seo/meta.ts), but a
// client-side navigation never reloads it. Same manifest, so the two can't drift.
export const usePageTitle = (): void => {
  const { pathname } = useLocation();
  const { locale, rest } = splitLocalePath(pathname);
  const page = pages.find((entry) => entry.path === rest.replace(/\/+$/, ""));
  const title = page ? `${getT(locale)(page.keys.title)} | ${SITE_NAME}` : SITE_NAME;

  useEffect(() => {
    document.title = title;
  }, [title]);
};
