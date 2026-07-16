import { ReactNode, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Carousel, Search } from "@components/ui";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import { shortenId } from "@helpers/strings";
import useNftCategories from "@hooks/nft/useNftCategories";
import useNftCollections from "@hooks/nft/useNftCollections";
import useNfts from "@hooks/nft/useNfts";
import useNftSearch from "@hooks/nft/useNftSearch";
import { NftCard } from "@hooks/nft/mapNft";
import { NftHeroTile, NftTile, OnSelectNft, SkeletonTile } from "./NftCards";
import CollectionCard from "./CollectionCard";
import CertificateDialog from "./CertificateDialog";

const FEATURED_LIMIT = 12;
const CATEGORY_LIMIT = 12;
const COLLECTIONS_LIMIT = 12;
const SKELETON_COUNT = 6;

const Section = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section>
    <div className="flex items-center justify-between h-9 mb-3">
      <h2 className="text-explorer-section font-semibold leading-none text-content">
        {title}
      </h2>
      {action && <div className="flex items-center sm:me-24">{action}</div>}
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
  onSelect,
}: {
  category: string;
  onSelect: OnSelectNft;
}) => {
  const { cards, isLoading } = useNfts({ category, limit: CATEGORY_LIMIT });

  if (!isLoading && cards.length === 0) return null;

  return (
    <Section title={category}>
      {isLoading ? (
        <SkeletonCarouselItems />
      ) : (
        <CardCarouselItems cards={cards} onSelect={onSelect} />
      )}
    </Section>
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

  const isEmpty =
    cards.length === 0 && collections.length === 0 && accounts.length === 0;

  return (
    <>
      <Section title={`${t("explorer.searchResults")} "${query}"`}>
        {isLoading ? (
          <SkeletonCarouselItems />
        ) : isError ? (
          <p className="text-muted">{t("explorer.loadError")}</p>
        ) : isEmpty ? (
          <p className="text-muted">{t("explorer.noResults")}</p>
        ) : cards.length === 0 ? (
          <p className="text-muted">{t("explorer.search.noCertificates")}</p>
        ) : (
          <CardCarouselItems cards={cards} onSelect={onSelect} />
        )}
      </Section>

      {collections.length > 0 && (
        <Section title={t("explorer.search.collections")}>
          {collections.map((collection) => (
            <Carousel.Item key={collection.canister_id}>
              <CollectionCard collection={collection} />
            </Carousel.Item>
          ))}
        </Section>
      )}

      {accounts.length > 0 && (
        <section>
          <h2 className="text-explorer-section font-semibold leading-none text-content mb-6">
            {t("explorer.search.collectors")}
          </h2>
          <div className="flex flex-col gap-2">
            {accounts.map((account) => (
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
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get("searchterm") ?? "").trim();
  const isSearching = searchTerm.length > 0;
  const [selectedNft, setSelectedNft] = useState<NftCard | null>(null);

  const categories = useNftCategories().data ?? [];

  return (
    <div className="max-w-page mx-auto py-8 px-6 sm:py-16">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 px-6 py-6 max-w-explorer-heading sm:px-16 sm:py-8">
          <h1 className="font-extrabold text-explorer-heading sm:text-explorer-heading-sm tracking-explorer-heading text-center text-content">
            {t("explorer.title")}
          </h1>
        </div>

        <Search
          id="search-explorer"
          placeholder={t("explorer.searchPlaceholder")}
          className="w-full max-w-2xl mt-4"
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
                key={category}
                category={category}
                onSelect={setSelectedNft}
              />
            ))}
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
