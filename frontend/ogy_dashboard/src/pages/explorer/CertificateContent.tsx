import { lazy, Suspense } from "react";
import { DateTime } from "luxon";
import { useLocale } from "@i18n/LocaleContext";
import useCollectionTemplate from "@hooks/nft/useCollectionTemplate";
import { NftCard, toCertificate } from "@hooks/nft/mapNft";
import { BlockchainLink, EXPLORER_SKELETON_CLASSES } from "./NftCards";
import SimpleCertificateBody from "./SimpleCertificateBody";

// The template viewer is the largest part of the explorer; load it only when
// a templated certificate is actually opened.
const CertificateViewer = lazy(
  () => import("@components/certificate/CertificateViewer")
);

export const CertificateSkeleton = () => (
  <div className="p-4 pt-2 flex flex-col gap-3" aria-busy="true">
    <div className={EXPLORER_SKELETON_CLASSES.certificatePill} />
    <div className={EXPLORER_SKELETON_CLASSES.certificateFrame} />
  </div>
);

const CertificateContent = ({ nft }: { nft: NftCard }) => {
  const { locale, t } = useLocale();
  const templateQuery = useCollectionTemplate(nft.canisterId);

  if (templateQuery.isLoading) return <CertificateSkeleton />;

  const template = templateQuery.data ?? null;

  if (!template) {
    return <SimpleCertificateBody nft={nft} />;
  }

  return (
    <div className="p-4 pt-2 flex flex-col gap-4">
      <Suspense fallback={<CertificateSkeleton />}>
        <CertificateViewer
          certificate={toCertificate(nft)}
          template={template}
          selectedLanguage={locale}
          certificateTabLabel={t("explorer.detail.certificate")}
        />
      </Suspense>
      <div className="flex items-center justify-between px-2 pb-2">
        <BlockchainLink canisterId={nft.canisterId} variant="detail" />
        {nft.mintedAtMs && (
          <span className="text-explorer-label font-light tracking-explorer-fine uppercase text-muted">
            {t("explorer.detail.mintedOn")}{" "}
            {DateTime.fromMillis(nft.mintedAtMs).toFormat("LLL dd, yyyy")}
          </span>
        )}
      </div>
    </div>
  );
};

export default CertificateContent;
