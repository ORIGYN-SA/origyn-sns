import { lazy, Suspense } from "react";
import { useLocale } from "@i18n/LocaleContext";
import useCollectionTemplate from "@hooks/nft/useCollectionTemplate";
import useNftCollection from "@hooks/nft/useNftCollection";
import { NftCard, toCertificate } from "@hooks/nft/mapNft";
import { EXPLORER_SKELETON_CLASSES } from "./NftCards";
import SimpleCertificateBody from "./SimpleCertificateBody";

// The template viewer is the largest part of the explorer; load it only when
// a templated certificate is actually opened.
const CertificateViewer = lazy(() =>
  import("@origyn/shared-ui/certificate").then((m) => ({
    default: m.CertificateViewer,
  }))
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
  const collectionQuery = useNftCollection(nft.canisterId);
  const collectionName = collectionQuery.data?.name ?? nft.collectionName;

  if (templateQuery.isLoading) return <CertificateSkeleton />;

  const template = templateQuery.data ?? null;

  if (!template) {
    return <SimpleCertificateBody nft={nft} collectionName={collectionName} />;
  }

  return (
    <div className="p-4 pt-2">
      <Suspense fallback={<CertificateSkeleton />}>
        <CertificateViewer
          certificate={toCertificate(nft)}
          template={template}
          selectedLanguage={locale}
          certificateTabLabel={t("explorer.detail.certificate")}
          // The Minting Studio default renders a "Custom stamp" placeholder;
          // the dashboard shows the actual minted stamp image.
          showCustomStampImage
        />
      </Suspense>
    </div>
  );
};

export default CertificateContent;
