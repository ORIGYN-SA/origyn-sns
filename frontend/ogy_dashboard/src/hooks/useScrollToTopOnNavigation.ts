import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function useScrollToTopOnNavigation() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType !== "POP") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname, navigationType]);
}
