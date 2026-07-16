import { lazy, Suspense } from "react";
import { DateTime } from "luxon";
import { useLocale, useLocalePath } from "@i18n/LocaleContext";
import { shortenId } from "@helpers/strings";
import useCollectionTemplate from "@hooks/nft/useCollectionTemplate";
import useNftCollection from "@hooks/nft/useNftCollection";
import { NftCard, toCertificate } from "@hooks/nft/mapNft";
import { BlockchainLink, EXPLORER_SKELETON_CLASSES } from "./NftCards";
import SimpleCertificateBody, { DetailItem } from "./SimpleCertificateBody";

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
  const lp = useLocalePath();
  const templateQuery = useCollectionTemplate(nft.canisterId);
  const collectionQuery = useNftCollection(nft.canisterId);
  const collectionName = collectionQuery.data?.name ?? nft.collectionName;

  if (templateQuery.isLoading) return <CertificateSkeleton />;

  const template = templateQuery.data ?? null;

  if (!template) {
    return <SimpleCertificateBody nft={nft} collectionName={collectionName} />;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2">
        <DetailItem
          label={t("explorer.detail.collection")}
          value={collectionName ?? shortenId(nft.canisterId)}
          to={lp(`/viewer/collections/${nft.canisterId}`)}
        />
        <DetailItem label={t("explorer.detail.tokenId")} value={nft.tokenId} />
        {nft.ownerAccount && (
          <DetailItem
            label={t("explorer.detail.owner")}
            value={shortenId(nft.ownerAccount)}
            to={lp(`/viewer/collectors/${nft.ownerAccount}`)}
          />
        )}
        {nft.mintedAtMs && (
          <DetailItem
            label={t("explorer.detail.mintedOn")}
            value={DateTime.fromMillis(nft.mintedAtMs).toFormat("LLL dd, yyyy")}
          />
        )}
      </div>
      <div className="flex items-center justify-between px-2 pb-2">
        <BlockchainLink canisterId={nft.canisterId} variant="detail" />
        <span className="text-explorer-label font-light tracking-explorer-fine uppercase text-muted">
          {t("explorer.detail.poweredBy")}
        </span>
      </div>
    </div>
  );
};

export default CertificateContent;
