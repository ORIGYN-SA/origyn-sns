import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function useScrollToTopOnNavigation() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (navigationType !== "POP") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname, navigationType]);
}
