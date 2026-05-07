import { Navigate } from "react-router-dom";

export const Neurons = () => {
  return (
    <Navigate
      to="/governance"
      replace
      state={{ scrollTo: "governance-neurons" }}
    />
  );
};
