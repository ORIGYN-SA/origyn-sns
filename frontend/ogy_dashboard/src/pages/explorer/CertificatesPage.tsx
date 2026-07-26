import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageContainer, PageHeader } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import useNftCategories from "@hooks/nft/useNftCategories";
import useNftsPage from "@hooks/nft/useNftsPage";
import { NftCard } from "@hooks/nft/mapNft";
import NftGrid from "./NftGrid";
import CertificateDialog from "./CertificateDialog";

const DEFAULT_PAGE_SIZE = 20;

type Order = "desc" | "asc";

export const CertificatesPage = () => {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [order, setOrder] = useState<Order>("desc");
  const [selectedNft, setSelectedNft] = useState<NftCard | null>(null);

  const categories = useNftCategories().data ?? [];
  const activeCategory = categories.find((item) => item.name === category);
  const { cards, total, isLoading } = useNftsPage({
    category,
    order,
    limit: pageSize,
    offset: pageIndex * pageSize,
  });

  const handleCategoryChange = (next: string | undefined) => {
    setPageIndex(0);
    const nextParams = new URLSearchParams(searchParams);
    if (next) {
      nextParams.set("category", next);
    } else {
      nextParams.delete("category");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const categoryPillClass = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active
        ? "border-content bg-surface-2 text-content"
        : "border-border text-muted hover:text-content"
    }`;

  return (
    <PageContainer>
      <PageHeader
        category={t("explorer.title")}
        title={t("explorer.certificatesPage.title")}
        onBack={() => navigate(-1)}
      />
      <div className="pt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap gap-2 min-w-0">
              <button
                type="button"
                onClick={() => handleCategoryChange(undefined)}
                className={categoryPillClass(!category)}
              >
                {t("explorer.certificatesPage.all")}
              </button>
              {categories.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleCategoryChange(item.name)}
                  className={categoryPillClass(category === item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
              <span className="hidden sm:inline">
                {t("explorer.certificatesPage.sortBy")}
              </span>
              <select
                value={order}
                onChange={(event) => {
                  setOrder(event.target.value as Order);
                  setPageIndex(0);
                }}
                className="rounded-full border border-border bg-surface ps-4 pe-9 py-1.5 text-sm text-content"
              >
                <option value="desc">
                  {t("explorer.certificatesPage.newest")}
                </option>
                <option value="asc">
                  {t("explorer.certificatesPage.oldest")}
                </option>
              </select>
            </label>
          </div>

          {activeCategory?.description && (
            <p className="text-sm text-muted leading-snug max-w-3xl">
              {activeCategory.description}
            </p>
          )}
        </div>

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
