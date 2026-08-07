import { ReactNode, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Carousel,
  NewTable,
  Search,
  SkeletonOverlay,
  TablePagination,
} from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import { shortenId } from "@helpers/strings";
import { asValidPrincipal } from "@helpers/principal";
import useNftCategories from "@hooks/nft/useNftCategories";
import useNftCollection, {
  collectionQueryOptions,
} from "@hooks/nft/useNftCollection";
import useNftCollections from "@hooks/nft/useNftCollections";
import useNfts from "@hooks/nft/useNfts";
import useNftSearch from "@hooks/nft/useNftSearch";
import useNftTransactions from "@hooks/nft/useNftTransactions";
import { useNftAccountStats } from "@hooks/nft/useNftAccount";
import { NftCard } from "@hooks/nft/mapNft";
import { NftHeroTile, NftTile, OnSelectNft, SkeletonTile } from "./NftCards";
import {
  buildNftTransactionSkeletonRows,
  getNftTransactionColumns,
} from "./nftTransactionColumns";
import CollectionCard from "./CollectionCard";
import CertificateDialog from "./CertificateDialog";

const FEATURED_LIMIT = 12;
const CATEGORY_LIMIT = 12;
const COLLECTIONS_LIMIT = 12;
const SKELETON_COUNT = 6;
const TRANSACTIONS_PAGE_SIZE = 10;

const Section = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string | null;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section>
    <div className="flex items-start justify-between gap-4 mb-3">
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="text-explorer-section font-semibold leading-none text-content">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted leading-snug max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center h-9 self-end shrink-0 sm:me-24">
          {action}
        </div>
      )}
    </div>
    <Carousel>{children}</Carousel>
  </section>
);

const ViewAllLink = ({ to }: { to: string }) => {
  const t = useT();
  const lp = useLocalePath();
  return (
    <Link
      to={lp(to)}
      className="text-sm text-muted hover:text-content transition-colors"
    >
      {t("explorer.viewAll")}
    </Link>
  );
};

const CardCarouselItems = ({
  cards,
  onSelect,
  hero = false,
}: {
  cards: NftCard[];
  onSelect: OnSelectNft;
  hero?: boolean;
}) => (
  <>
    {cards.map((nft) => (
      <Carousel.Item key={nft.id}>
        {hero ? (
          <NftHeroTile nft={nft} onSelect={onSelect} />
        ) : (
          <NftTile nft={nft} onSelect={onSelect} />
        )}
      </Carousel.Item>
    ))}
  </>
);

const SkeletonCarouselItems = ({ hero = false }: { hero?: boolean }) => (
  <>
    {Array.from({ length: hero ? 2 : SKELETON_COUNT }).map((_, i) => (
      <Carousel.Item key={i}>
        <SkeletonTile hero={hero} />
      </Carousel.Item>
    ))}
  </>
);

const FeaturedSection = ({ onSelect }: { onSelect: OnSelectNft }) => {
  const t = useT();
  const { cards, isLoading } = useNfts({ limit: FEATURED_LIMIT });

  if (!isLoading && cards.length === 0) return null;

  return (
    <Section
      title={t("explorer.sections.featured")}
      action={<ViewAllLink to="/viewer/certificates" />}
    >
      {isLoading ? (
        <SkeletonCarouselItems hero />
      ) : (
        <CardCarouselItems cards={cards} onSelect={onSelect} hero />
      )}
    </Section>
  );
};

const CollectionsSection = () => {
  const t = useT();
  const { data, isLoading } = useNftCollections({ limit: COLLECTIONS_LIMIT });
  const collections = data?.items ?? [];

  if (!isLoading && collections.length === 0) return null;

  return (
    <Section
      title={t("explorer.sections.collections")}
      action={<ViewAllLink to="/viewer/collections" />}
    >
      {isLoading ? (
        <SkeletonCarouselItems />
      ) : (
        <>
          {collections.map((collection) => (
            <Carousel.Item key={collection.canister_id}>
              <CollectionCard collection={collection} />
            </Carousel.Item>
          ))}
        </>
      )}
    </Section>
  );
};

const CategorySection = ({
  category,
  description,
  onSelect,
}: {
  category: string;
  description?: string | null;
  onSelect: OnSelectNft;
}) => {
  const { cards, isLoading } = useNfts({ category, limit: CATEGORY_LIMIT });

  if (!isLoading && cards.length === 0) return null;

  return (
    <Section
      title={category}
      description={description}
      action={
        <ViewAllLink
          to={`/viewer/certificates?category=${encodeURIComponent(category)}`}
        />
      }
    >
      {isLoading ? (
        <SkeletonCarouselItems />
      ) : (
        <CardCarouselItems cards={cards} onSelect={onSelect} />
      )}
    </Section>
  );
};

const TransactionsSection = () => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(TRANSACTIONS_PAGE_SIZE);

  const { items, total, isLoading, isPlaceholderData, isError } =
    useNftTransactions({
      limit: pageSize,
      offset: pageSize * pageIndex,
    });

  const hasError = !isLoading && isError;
  // isPlaceholderData covers page changes; a background refetch of the current
  // page keeps its rows instead of flashing back to skeletons.
  const showSkeleton = isLoading || isPlaceholderData || hasError;

  const columns = useMemo(
    () => getNftTransactionColumns((path) => navigate(lp(path)), t),
    [navigate, lp, t]
  );

  const rows = showSkeleton ? buildNftTransactionSkeletonRows(pageSize) : items;

  if (!showSkeleton && total === 0) return null;

  return (
    <section>
      <h2 className="text-explorer-section font-semibold leading-none text-content mb-6">
        {t("explorer.sections.transactions")}
      </h2>
      <div className="relative">
        <SkeletonOverlay loading={showSkeleton}>
          {hasError && (
            <CardErrorOverlay title={t("explorer.sections.transactions")} />
          )}
          <NewTable
            columns={columns}
            data={rows}
            footer={
              <TablePagination
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageCount={Math.ceil(total / pageSize)}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPageIndex(0);
                }}
              />
            }
          />
        </SkeletonOverlay>
      </div>
    </section>
  );
};

const SearchResults = ({
  query,
  onSelect,
}: {
  query: string;
  onSelect: OnSelectNft;
}) => {
  const t = useT();
  const lp = useLocalePath();
  const { cards, collections, accounts, isLoading, isError } =
    useNftSearch(query);

  const queryPrincipal = asValidPrincipal(query);
  const collectionQuery = useNftCollection(queryPrincipal);
  const queryCollection = collectionQuery.data;
  const collectionRows =
    queryCollection &&
    !collections.some(
      (collection) => collection.canister_id === queryCollection.canister_id
    )
      ? [queryCollection, ...collections]
      : collections;

  const principalStats = useNftAccountStats(
    collectionQuery.isSuccess && !queryCollection ? queryPrincipal : null
  );
  const showQueryPrincipalRow =
    queryPrincipal !== null &&
    collectionQuery.isSuccess &&
    queryCollection === null &&
    !accounts.some((account) => account.principal === queryPrincipal);
  const accountRows = showQueryPrincipalRow
    ? [
        {
          principal: queryPrincipal,
          held_tokens: principalStats.data?.owned_count ?? 0,
          created_collections: 0,
        },
        ...accounts,
      ]
    : accounts;

  const isLoadingResults = isLoading || collectionQuery.isLoading;
  const isErrorResults = isError || collectionQuery.isError;
  const isEmpty =
    cards.length === 0 &&
    collectionRows.length === 0 &&
    accountRows.length === 0;

  return (
    <>
      <Section title={`${t("explorer.searchResults")} "${query}"`}>
        {isLoadingResults ? (
          <SkeletonCarouselItems />
        ) : isErrorResults ? (
          <p className="text-muted">{t("explorer.loadError")}</p>
        ) : isEmpty ? (
          <p className="text-muted">{t("explorer.noResults")}</p>
        ) : cards.length === 0 ? (
          <p className="text-muted">{t("explorer.search.noCertificates")}</p>
        ) : (
          <CardCarouselItems cards={cards} onSelect={onSelect} />
        )}
      </Section>

      {collectionRows.length > 0 && (
        <Section title={t("explorer.search.collections")}>
          {collectionRows.map((collection) => (
            <Carousel.Item key={collection.canister_id}>
              <CollectionCard collection={collection} />
            </Carousel.Item>
          ))}
        </Section>
      )}

      {accountRows.length > 0 && (
        <section>
          <h2 className="text-explorer-section font-semibold leading-none text-content mb-6">
            {t("explorer.search.collectors")}
          </h2>
          <div className="flex flex-col gap-2">
            {accountRows.map((account) => (
              <Link
                key={account.principal}
                to={lp(`/viewer/collectors/${account.principal}`)}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-content/40"
              >
                <span
                  className="text-sm text-content"
                  title={account.principal}
                >
                  {shortenId(account.principal)}
                </span>
                <span className="text-xs text-muted">
                  {account.held_tokens}{" "}
                  {t.plural("explorer.collections.items", account.held_tokens)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export const Explorer = () => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get("searchterm") ?? "").trim();
  const isSearching = searchTerm.length > 0;
  const [selectedNft, setSelectedNft] = useState<NftCard | null>(null);

  const categories = useNftCategories().data ?? [];

  const handleSearchEnter = async (value: string) => {
    const principal = asValidPrincipal(value);
    if (!principal) return;

    let collection;
    try {
      collection = await queryClient.fetchQuery(
        collectionQueryOptions(principal)
      );
    } catch {
      return;
    }

    navigate(
      lp(
        collection
          ? `/viewer/collections/${principal}`
          : `/viewer/collectors/${principal}`
      )
    );
  };

  return (
    <div className="max-w-page mx-auto py-8 px-6 sm:py-16">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 px-6 py-6 max-w-explorer-heading sm:px-16 sm:py-8">
          <h1 className="font-extrabold text-explorer-heading sm:text-explorer-heading-sm tracking-explorer-heading text-center text-content">
            {t("explorer.title")}
          </h1>
          <p className="font-light text-[16px] sm:text-[22px] leading-snug sm:leading-none text-center text-muted">
            {t("explorer.subtitle")}
          </p>
        </div>

        <Search
          id="search-explorer"
          placeholder={t("explorer.searchPlaceholder")}
          className="w-full max-w-2xl mt-4"
          onEnter={handleSearchEnter}
        />
      </div>

      <div className="mt-16 flex flex-col gap-16">
        {isSearching ? (
          <SearchResults query={searchTerm} onSelect={setSelectedNft} />
        ) : (
          <>
            <FeaturedSection onSelect={setSelectedNft} />
            <CollectionsSection />
            {categories.map((category) => (
              <CategorySection
                key={category.name}
                category={category.name}
                description={category.description}
                onSelect={setSelectedNft}
              />
            ))}
            <TransactionsSection />
          </>
        )}
      </div>

      <CertificateDialog
        nft={selectedNft}
        onClose={() => setSelectedNft(null)}
      />
    </div>
  );
};
