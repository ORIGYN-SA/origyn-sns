import { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LoaderSpin } from "@components/ui";
import { useLocalePath } from "@i18n/LocaleContext";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { isCollectionVisible } from "@services/api/gldt/v1/collectionVisibility";

export const VisibleCollection = ({ children }: { children: ReactNode }) => {
  const { canisterId = "" } = useParams();
  const lp = useLocalePath();
  const isVisible = useQuery({
    queryKey: ["NFT_COLLECTION_VISIBILITY"],
    queryFn: gldtEndpoints.getIsVisible,
    staleTime: Infinity,
  });

  if (!isCollectionVisible(canisterId)) {
    return <Navigate to={lp("/viewer")} replace />;
  }
  // Same spinner as the lazy page fallback, so loading doesn't shift layout.
  if (isVisible.isPending) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoaderSpin size="md" />
      </div>
    );
  }
  // If the AI list can't load, the page still opens. Collection pages also
  // check is_ai on the collection itself.
  if (isVisible.data && !isVisible.data(canisterId)) {
    return <Navigate to={lp("/viewer")} replace />;
  }
  return children;
};
