import { Navigate } from "react-router-dom";

export const TokenDistribution = () => {
  return (
    <Navigate
      to="/"
      replace
      state={{ scrollTo: "ogy-token-distribution" }}
    />
  );
};
