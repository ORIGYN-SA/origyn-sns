import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DateTime } from "luxon";
import { PageContainer, PageHeader, TablePagination } from "@components/ui";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import { shortenId } from "@helpers/strings";
import useNftCollectionDetail, {
  useNftCollectionHolders,
} from "@hooks/nft/useNftCollectionDetail";
import useNftsPage from "@hooks/nft/useNftsPage";
import { NftCard } from "@hooks/nft/mapNft";
import {
  EXPLORER_SKELETON_CLASSES,
  NftImage,
  BlockchainLink,
} from "./NftCards";
import NftGrid from "./NftGrid";
import NftTransactionsTable from "./NftTransactionsTable";
import CertificateDialog from "./CertificateDialog";

const DEFAULT_PAGE_SIZE = 20;
const TABS = ["certificates", "holders", "transactions"] as const;

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <div className="text-explorer-label font-medium tracking-explorer-meta uppercase text-muted">
      {label}
    </div>
    <div className="text-lg font-semibold text-content">{value}</div>
  </div>
);

const HoldersTable = ({ canisterId }: { canisterId: string }) => {
  const t = useT();
  const lp = useLocalePath();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { items, total, isLoading } = useNftCollectionHolders(canisterId, {
    limit: pageSize,
    offset: pageIndex * pageSize,
  });

  if (isLoading && items.length === 0) {
    return (
      <div className="h-collection-summary rounded-xl bg-muted/20 animate-pulse" />
    );
  }

  if (total === 0)
    return <p className="text-muted">{t("explorer.noResults")}</p>;

  const pageCount = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-explorer-label font-medium tracking-explorer-meta uppercase text-muted">
              <th className="text-start font-medium pb-3">
                {t("explorer.detail.certificate")}
              </th>
              <th className="text-start font-medium pb-3">
                {t("explorer.detail.owner")}
              </th>
              <th className="text-start font-medium pb-3">
                {t("explorer.detail.mintedOn")}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.token_id} className="border-t border-border">
                <td className="py-3 pe-4 text-content">
                  <Link
                    to={lp(
                      `/viewer/certificate/${canisterId}/${encodeURIComponent(item.token_id)}`
                    )}
                    className="hover:underline"
                  >
                    {item.name ?? `#${item.token_id}`}
                  </Link>
                </td>
                <td className="py-3 pe-4">
                  <Link
                    to={lp(`/viewer/collectors/${item.owner_account}`)}
                    className="text-muted hover:text-content transition-colors"
                    title={item.owner_account}
                  >
                    {shortenId(item.owner_account)}
                  </Link>
                </td>
                <td className="py-3 text-muted">
                  {DateTime.fromMillis(item.minted_at_ms).toFormat(
                    "LLL dd, yyyy"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <TablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
        />
      )}
    </div>
  );
};

export const CollectionDetailPage = () => {
  const t = useT();
  const navigate = useNavigate();
  const { canisterId = "" } = useParams();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedNft, setSelectedNft] = useState<NftCard | null>(null);
  const [view, setView] = useState<(typeof TABS)[number]>("certificates");

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

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setView(tab)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                view === tab
                  ? "border-content bg-surface-2 text-content"
                  : "border-border text-muted hover:text-content"
              }`}
            >
              {t(`explorer.collectionPage.${tab}`)}
            </button>
          ))}
        </div>

        {view === "certificates" && (
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
        )}
        {view === "holders" && <HoldersTable canisterId={canisterId} />}
        {view === "transactions" && (
          <NftTransactionsTable
            collection={canisterId}
            showCollection={false}
          />
        )}
      </div>

      <CertificateDialog
        nft={selectedNft}
        onClose={() => setSelectedNft(null)}
      />
    </PageContainer>
  );
};
