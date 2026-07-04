import { Link } from "react-router-dom";
import { Dialog } from "@components/ui";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import useCollectionTemplate from "@hooks/nft/useCollectionTemplate";
import { NftCard } from "@hooks/nft/mapNft";
import CertificateContent from "./CertificateContent";

const CertificateDialog = ({
  nft,
  onClose,
}: {
  nft: NftCard | null;
  onClose: () => void;
}) => {
  const t = useT();
  const lp = useLocalePath();
  // Cached alongside CertificateContent's identical query; only used to size
  // the panel for the template-driven layout.
  const templateQuery = useCollectionTemplate(nft?.canisterId ?? null);

  if (!nft) return null;

  const hasTemplate = Boolean(templateQuery.data);

  return (
    <Dialog
      show
      handleClose={onClose}
      panelClassName={
        hasTemplate
          ? "max-w-[1200px] max-h-[92vh] overflow-y-auto"
          : "max-w-2xl max-h-[90vh] overflow-y-auto"
      }
      floatingClose={!hasTemplate && !templateQuery.isLoading}
    >
      <CertificateContent nft={nft} />
      <div className="flex justify-center pb-4">
        <Link
          to={lp(`/explorer/certificate/${nft.canisterId}/${nft.tokenId}`)}
          className="text-xs text-muted hover:text-content transition-colors"
        >
          {t("explorer.detail.openPage")}
        </Link>
      </div>
    </Dialog>
  );
};

export default CertificateDialog;
