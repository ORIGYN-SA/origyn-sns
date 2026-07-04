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

export const CertificatesPage = () => {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedNft, setSelectedNft] = useState<NftCard | null>(null);

  const categories = useNftCategories().data ?? [];
  const { cards, total, isLoading } = useNftsPage({
    category,
    limit: pageSize,
    offset: pageIndex * pageSize,
  });

  const handleCategoryChange = (next: string | undefined) => {
    setPageIndex(0);
    if (next) {
      searchParams.set("category", next);
    } else {
      searchParams.delete("category");
    }
    setSearchParams(searchParams);
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange(undefined)}
            className={categoryPillClass(!category)}
          >
            {t("explorer.certificatesPage.all")}
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleCategoryChange(item)}
              className={categoryPillClass(category === item)}
            >
              {item}
            </button>
          ))}
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
