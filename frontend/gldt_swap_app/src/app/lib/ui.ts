import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { atom, useAtom, useSetAtom } from "jotai";

/** Below this width the app uses its phone layout, as app.gold-dao.org does (Tailwind's xl). */
const PHONE_QUERY = "(max-width: 1279px)";

const subscribeMedia = (query: string) => (cb: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export const useMedia = (query: string): boolean =>
  useSyncExternalStore(subscribeMedia(query), () => window.matchMedia(query).matches);

export const useIsPhone = (): boolean => useMedia(PHONE_QUERY);

export type ThemeChoice = "light" | "dark" | "system";
const THEME_KEY = "gldt-app-theme";

const readTheme = (): ThemeChoice => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // Storage can be blocked; the system theme is the default.
  }
  return "system";
};

// One choice for the whole app: the footer's switch and the root that applies it share it.
const themeAtom = atom<ThemeChoice>(readTheme());

/** The theme the viewer picked in the footer, and the one that applies. */
export const useTheme = () => {
  const [choice, setChoice] = useAtom(themeAtom);
  const systemDark = useMedia("(prefers-color-scheme: dark)");
  const pick = useCallback(
    (c: ThemeChoice) => {
      setChoice(c);
      try {
        localStorage.setItem(THEME_KEY, c);
      } catch {
        // Not remembered, but still applied.
      }
    },
    [setChoice]
  );
  const applied: "light" | "dark" = choice === "system" ? (systemDark ? "dark" : "light") : choice;
  return { choice, applied, pick };
};

/** A menu or dialog that plays its closing animation before it unmounts, like the design's `.out`
 * classes (100 ms for menus, 300 ms for fades). */
export const useClosing = (ms: number) => {
  const [open, setOpen] = useState(false);
  const [out, setOut] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = useCallback(() => {
    clearTimeout(timer.current);
    setOut(false);
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOut(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(false);
      setOut(false);
    }, ms);
  }, [ms]);
  return { open, out, show, close, toggle: open && !out ? close : show };
};

export type Toast = { id: number; message: string };
export const toastAtom = atom<Toast | null>(null);

/** Shows one short message at the bottom, as the design's "That's copied!" toast. */
export const useToast = () => {
  const set = useSetAtom(toastAtom);
  return useCallback((message: string) => set({ id: Date.now(), message }), [set]);
};

export const useCopy = () => {
  const toast = useToast();
  return useCallback(
    (text: string) => {
      navigator.clipboard?.writeText(text).catch(() => undefined);
      toast("That's copied!");
    },
    [toast]
  );
};
