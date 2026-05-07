import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const HASH_SCROLL_OFFSET_PX = 96;
const HASH_SCROLL_RETRY_DELAY_MS = 50;
const HASH_SCROLL_MAX_ATTEMPTS = 20;

const getHashTargetId = (hash: string) => {
  if (!hash) return null;

  const targetId = hash.slice(1);

  try {
    return decodeURIComponent(targetId);
  } catch {
    return targetId;
  }
};

export default function useScrollToTopOnNavigation() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFirstRun = useRef(true);

  useEffect(() => {
    const isInitialNavigation = isFirstRun.current;
    isFirstRun.current = false;
    const hashTargetId = getHashTargetId(location.hash);

    if (hashTargetId) {
      let timeoutId: number | undefined;
      let attempts = 0;

      const scrollToHashTarget = () => {
        const target = document.getElementById(hashTargetId);

        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY;

          window.scrollTo({
            top: Math.max(top - HASH_SCROLL_OFFSET_PX, 0),
          });
          return;
        }

        if (attempts < HASH_SCROLL_MAX_ATTEMPTS) {
          attempts += 1;
          timeoutId = window.setTimeout(
            scrollToHashTarget,
            HASH_SCROLL_RETRY_DELAY_MS
          );
        }
      };

      timeoutId = window.setTimeout(scrollToHashTarget, 0);

      return () => {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    if (isInitialNavigation) return;

    const state = location.state as { scrollTo?: string } | null;
    if (navigationType !== "POP" && !state?.scrollTo) {
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname, location.hash, navigationType, location.state]);
}
