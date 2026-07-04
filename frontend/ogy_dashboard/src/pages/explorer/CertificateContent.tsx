import { lazy, Suspense } from "react";
import { DateTime } from "luxon";
import { useLocale } from "@i18n/LocaleContext";
import useCollectionTemplate from "@hooks/nft/useCollectionTemplate";
import { NftCard, toCertificate } from "@hooks/nft/mapNft";
import { BlockchainLink } from "./NftCards";
import SimpleCertificateBody from "./SimpleCertificateBody";

// The template viewer is the largest part of the explorer; load it only when
// a templated certificate is actually opened.
const CertificateViewer = lazy(
  () => import("@components/certificate/CertificateViewer")
);

// Mirrors the viewer shape: tab pill bar on top of the certificate paper.
export const CertificateSkeleton = () => (
  <div className="p-4 pt-2 flex flex-col gap-3" aria-busy="true">
    <div className="h-12 w-full max-w-[280px] mx-auto rounded-full bg-surface-2 animate-pulse" />
    <div className="h-[420px] sm:h-[560px] rounded-[24px] bg-surface-2 animate-pulse" />
  </div>
);

// Template-driven certificate rendering with the simple layout as fallback.
// Shared by the explorer dialog and the certificate permalink page.
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
          <span className="text-[10px] font-light tracking-[2px] uppercase text-muted">
            {t("explorer.detail.mintedOn")}{" "}
            {DateTime.fromMillis(nft.mintedAtMs).toFormat("LLL dd, yyyy")}
          </span>
        )}
      </div>
    </div>
  );
};

export default CertificateContent;
