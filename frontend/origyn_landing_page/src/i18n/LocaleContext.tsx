import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dirFor, getT, normalizeLocale, type Locale, type Translate } from ".";

type LocaleContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Translate;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale | string | undefined;
  children: ReactNode;
}) {
  const value = useMemo<LocaleContextValue>(() => {
    const active = normalizeLocale(locale);
    return { locale: active, dir: dirFor(active), t: getT(active) };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

export function useT(): Translate {
  return useLocale().t;
}
