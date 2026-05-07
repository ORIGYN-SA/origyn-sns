import { Navigate } from "react-router-dom";

export const Proposals = () => {
  return (
    <Navigate
      to="/governance"
      replace
      state={{ scrollTo: "governance-proposals" }}
    />
  );
};
