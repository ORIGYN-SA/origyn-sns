import { Navigate } from "react-router-dom";
import { useLocalePath } from "@i18n/LocaleContext";

export const TokenDistribution = () => {
  const lp = useLocalePath();
  return (
    <Navigate to={lp("/")} replace state={{ scrollTo: "ogy-token-distribution" }} />
  );
};
