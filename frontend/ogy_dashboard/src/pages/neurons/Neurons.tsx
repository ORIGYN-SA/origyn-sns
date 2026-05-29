import { Navigate } from "react-router-dom";
import { useLocalePath } from "@i18n/LocaleContext";

export const Neurons = () => {
  const lp = useLocalePath();
  return (
    <Navigate
      to={lp("/governance")}
      replace
      state={{ scrollTo: "governance-neurons" }}
    />
  );
};
