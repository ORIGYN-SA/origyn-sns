import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@components/ui/icons";
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
          ? "max-w-certificate max-h-dialog-template overflow-y-auto"
          : "max-w-2xl max-h-dialog overflow-y-auto"
      }
      headerStart={
        <Link
          to={lp(`/viewer/certificate/${nft.canisterId}/${nft.tokenId}`)}
          className="inline-flex items-center gap-2 rounded-full bg-content px-5 py-2.5 text-explorer-link-detail font-medium text-surface transition-opacity hover:opacity-80"
        >
          {t("explorer.detail.openPage")}
          <ChevronRightIcon className="rtl:-scale-x-100" aria-hidden />
        </Link>
      }
    >
      <CertificateContent nft={nft} />
    </Dialog>
  );
};

export default CertificateDialog;
