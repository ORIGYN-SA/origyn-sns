import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function useScrollToTopOnNavigation() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const state = location.state as { scrollTo?: string } | null;
    if (navigationType !== "POP" && !state?.scrollTo) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname, navigationType, location.state]);
}
