import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const useScrollToTopOnNavigate = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, search, hash]);
};

export default useScrollToTopOnNavigate;
