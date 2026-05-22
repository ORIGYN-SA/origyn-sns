import { useEffect } from "react";
import { dirFor, type Locale } from ".";

// Sync <html lang/dir> with the active locale while the AI page is mounted, and
// restore the previous values on unmount so other routes are unaffected.
// useEffect lives here, isolated in a hook, rather than in a component body.
export function useHtmlLang(locale: Locale): void {
  useEffect(() => {
    const root = document.documentElement;
    const prevLang = root.getAttribute("lang");
    const prevDir = root.getAttribute("dir");

    root.setAttribute("lang", locale);
    root.setAttribute("dir", dirFor(locale));

    return () => {
      if (prevLang === null) root.removeAttribute("lang");
      else root.setAttribute("lang", prevLang);
      if (prevDir === null) root.removeAttribute("dir");
      else root.setAttribute("dir", prevDir);
    };
  }, [locale]);
}
