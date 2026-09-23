import { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useLocalePath } from "@i18n/LocaleContext";
import { isCollectionVisible } from "@services/api/gldt/v1/collectionVisibility";

export const VisibleCollection = ({ children }: { children: ReactNode }) => {
  const { canisterId = "" } = useParams();
  const lp = useLocalePath();

  return isCollectionVisible(canisterId) ? (
    children
  ) : (
    <Navigate to={lp("/viewer")} replace />
  );
};
