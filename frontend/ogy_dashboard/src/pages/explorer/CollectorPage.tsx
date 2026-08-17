import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DateTime } from "luxon";
import { Carousel, PageContainer, PageHeader } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { shortenId } from "@helpers/strings";
import {
  useNftAccountCollections,
  useNftAccountNfts,
  useNftAccountPastNfts,
  useNftAccountStats,
  useNftOwnerNfts,
} from "@hooks/nft/useNftAccount";
import { NftOwnedStatus } from "@services/api/gldt/v1/types";
import { NftCard } from "@hooks/nft/mapNft";
import NftGrid from "./NftGrid";
import NftTransactionsTable from "./NftTransactionsTable";
import CollectionCard from "./CollectionCard";
import { EXPLORER_SKELETON_CLASSES, NftTile, SkeletonTile } from "./NftCards";
import CertificateDialog from "./CertificateDialog";

const DEFAULT_PAGE_SIZE = 20;
const PAST_LIMIT = 12;

const STATUSES: (NftOwnedStatus | "all")[] = [
  "all",
  "Minted",
  "Received",
  "Transferred",
];

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <div className="text-explorer-label font-medium tracking-explorer-meta uppercase text-muted">
      {label}
    </div>
    <div className="text-lg font-semibold text-content">{value}</div>
  </div>
);

const OwnerHistory = ({
  principal,
  onSelect,
}: {
  principal: string | null;
  onSelect: (nft: NftCard) => void;
}) => {
  const t = useT();
  const [status, setStatus] = useState<NftOwnedStatus | "all">("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const history = useNftOwnerNfts(principal, {
    status: status === "all" ? undefined : status,
    limit: pageSize,
    offset: pageIndex * pageSize,
  });

  if (!history.isLoading && history.total === 0 && status === "all") {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-explorer-section font-semibold leading-none text-content mb-6">
        {t("explorer.collector.historyTitle")}
      </h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setStatus(option);
              setPageIndex(0);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              status === option
                ? "border-content bg-surface-2 text-content"
                : "border-border text-muted hover:text-content"
            }`}
          >
            {t(`explorer.collector.status.${option}`)}
          </button>
        ))}
      </div>
      <NftGrid
        cards={history.cards}
        isLoading={history.isLoading}
        onSelect={onSelect}
        total={history.total}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
      />
    </section>
  );
};

export const CollectorPage = () => {
  const t = useT();
  const navigate = useNavigate();
  const { principal = null } = useParams();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedNft, setSelectedNft] = useState<NftCard | null>(null);

  const stats = useNftAccountStats(principal);
  const collections = useNftAccountCollections(principal);
  const nfts = useNftAccountNfts(principal, {
    limit: pageSize,
    offset: pageIndex * pageSize,
  });
  const pastNfts = useNftAccountPastNfts(principal, { limit: PAST_LIMIT });

  const heldCollections = collections.data?.items ?? [];
  const formatDate = (ms: number) =>
    DateTime.fromMillis(ms).toFormat("LLL dd, yyyy");

  return (
    <PageContainer>
      <PageHeader
        category={t("explorer.collector.title")}
        title={shortenId(principal ?? "")}
        onBack={() => navigate(-1)}
      />
      <div className="pt-8">
        {stats.isLoading && (
          <div
            className="flex flex-wrap gap-x-8 gap-y-4 mb-12"
            aria-busy="true"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={EXPLORER_SKELETON_CLASSES.stat} />
            ))}
          </div>
        )}
        {stats.data && (
          <div className="flex flex-wrap gap-x-8 gap-y-4 mb-12">
            <Stat
              label={t("explorer.collector.owned")}
              value={String(stats.data.owned_count)}
            />
            <Stat
              label={t("explorer.collector.collections")}
              value={String(stats.data.distinct_collections)}
            />
            <Stat
              label={t("explorer.collector.firstActivity")}
              value={formatDate(stats.data.first_activity_ms)}
            />
            <Stat
              label={t("explorer.collector.lastActivity")}
              value={formatDate(stats.data.last_activity_ms)}
            />
          </div>
        )}

        {(collections.isLoading || heldCollections.length > 0) && (
          <section className="mb-12">
            <h2 className="text-explorer-section font-semibold leading-none text-content mb-6">
              {t("explorer.collector.collectionsTitle")}
            </h2>
            <Carousel>
              {collections.isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Carousel.Item key={i}>
                      <SkeletonTile />
                    </Carousel.Item>
                  ))
                : heldCollections.map((collection) => (
                    <Carousel.Item key={collection.canister_id}>
                      <CollectionCard
                        collection={{
                          ...collection,
                          total_tokens: collection.held_count,
                        }}
                      />
                    </Carousel.Item>
                  ))}
            </Carousel>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-explorer-section font-semibold leading-none text-content mb-6">
            {t("explorer.collector.certificatesTitle")}
          </h2>
          <NftGrid
            cards={nfts.cards}
            isLoading={nfts.isLoading}
            onSelect={setSelectedNft}
            total={nfts.total}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
          />
        </section>

        <OwnerHistory principal={principal} onSelect={setSelectedNft} />

        <NftTransactionsTable
          className="mb-12"
          title={t("explorer.sections.transactions")}
          account={principal}
          showDirection
        />

        {pastNfts.cards.length > 0 && (
          <section>
            <h2 className="text-explorer-section font-semibold leading-none text-content mb-6">
              {t("explorer.collector.pastTitle")}
            </h2>
            <Carousel>
              {pastNfts.cards.map((nft) => (
                <Carousel.Item key={nft.id}>
                  <NftTile nft={nft} onSelect={setSelectedNft} />
                </Carousel.Item>
              ))}
            </Carousel>
          </section>
        )}
      </div>

      <CertificateDialog
        nft={selectedNft}
        onClose={() => setSelectedNft(null)}
      />
    </PageContainer>
  );
};
