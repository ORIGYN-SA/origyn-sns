import { useNavigate, useParams } from "react-router-dom";
import { PageContainer, PageHeader } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import useNftToken from "@hooks/nft/useNftToken";
import CertificateContent, { CertificateSkeleton } from "./CertificateContent";
import CertificateSummary from "./CertificateSummary";

export const CertificatePage = () => {
  const t = useT();
  const navigate = useNavigate();
  const { canisterId = null, tokenId = null } = useParams();
  const { card, isLoading, isError } = useNftToken(canisterId, tokenId);

  return (
    <PageContainer>
      <PageHeader
        category={t("explorer.title")}
        title={card?.name ?? t("explorer.detail.certificate")}
        onBack={() => navigate(-1)}
      />
      <div className="pt-8">
        {isLoading ? (
          <CertificateSkeleton />
        ) : isError || !card ? (
          <p className="text-muted text-center">
            {t("explorer.certificatePage.notFound")}
          </p>
        ) : (
          <>
            <CertificateSummary nft={card} />
            <div className="rounded-xl bg-surface">
              <CertificateContent nft={card} />
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};
