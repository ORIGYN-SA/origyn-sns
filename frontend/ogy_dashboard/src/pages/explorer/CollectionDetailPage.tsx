import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer, PageHeader } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import useNftCollectionDetail from "@hooks/nft/useNftCollectionDetail";
import useNftsPage from "@hooks/nft/useNftsPage";
import { NftCard } from "@hooks/nft/mapNft";
import {
  EXPLORER_SKELETON_CLASSES,
  NftImage,
  BlockchainLink,
} from "./NftCards";
import NftGrid from "./NftGrid";
import CertificateDialog from "./CertificateDialog";

const DEFAULT_PAGE_SIZE = 20;

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <div className="text-explorer-label font-medium tracking-explorer-meta uppercase text-muted">
      {label}
    </div>
    <div className="text-lg font-semibold text-content">{value}</div>
  </div>
);

export const CollectionDetailPage = () => {
  const t = useT();
  const navigate = useNavigate();
  const { canisterId = "" } = useParams();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedNft, setSelectedNft] = useState<NftCard | null>(null);

  const { collection } = useNftCollectionDetail(canisterId);
  const { cards, total, isLoading } = useNftsPage({
    collection: canisterId,
    limit: pageSize,
    offset: pageIndex * pageSize,
  });

  const info = collection.data;

  return (
    <PageContainer>
      <PageHeader
        category={t("explorer.detail.collection")}
        title={info?.name ?? canisterId}
        onBack={() => navigate(-1)}
      />
      <div className="pt-8">
        {collection.isLoading ? (
          <div className={EXPLORER_SKELETON_CLASSES.collectionSummary} />
        ) : collection.isError || !info ? (
          <p className="text-muted mb-12">{t("explorer.loadError")}</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 mb-12">
            <NftImage
              src={info.logo ?? cards[0]?.imageUrl ?? null}
              alt={info.name ?? info.canister_id}
              className="h-collection-logo w-collection-logo shrink-0 rounded-xl overflow-hidden"
            />
            <div className="flex flex-col gap-3 min-w-0">
              {info.description && (
                <p className="text-sm text-muted leading-relaxed max-w-3xl">
                  {info.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
                <Stat
                  label={t.plural(
                    "explorer.collections.items",
                    info.total_tokens
                  )}
                  value={String(info.total_tokens)}
                />
                <Stat
                  label={t.plural(
                    "explorer.collections.holders",
                    info.distinct_holders
                  )}
                  value={String(info.distinct_holders)}
                />
                <BlockchainLink
                  canisterId={info.canister_id}
                  variant="detail"
                />
              </div>
            </div>
          </div>
        )}

        <NftGrid
          cards={cards}
          isLoading={isLoading}
          onSelect={setSelectedNft}
          total={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
        />
      </div>

      <CertificateDialog
        nft={selectedNft}
        onClose={() => setSelectedNft(null)}
      />
    </PageContainer>
  );
};
