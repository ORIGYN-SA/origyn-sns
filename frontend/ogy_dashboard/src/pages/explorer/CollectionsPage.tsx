import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer, PageHeader, TablePagination } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import useNftCollections from "@hooks/nft/useNftCollections";
import CollectionCard from "./CollectionCard";
import { EXPLORER_SKELETON_CLASSES } from "./NftCards";

const DEFAULT_PAGE_SIZE = 20;

export const CollectionsPage = () => {
  const t = useT();
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading } = useNftCollections({
    limit: pageSize,
    offset: pageIndex * pageSize,
  });
  const collections = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return (
    <PageContainer>
      <PageHeader
        category={t("explorer.title")}
        title={t("explorer.collectionsPage.title")}
        onBack={() => navigate(-1)}
      />
      <div className="pt-8">
        {!isLoading && collections.length === 0 ? (
          <p className="text-muted">{t("explorer.noResults")}</p>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={EXPLORER_SKELETON_CLASSES.collectionTile}
                    />
                  ))
                : collections.map((collection) => (
                    <CollectionCard
                      key={collection.canister_id}
                      collection={collection}
                    />
                  ))}
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
        )}
      </div>
    </PageContainer>
  );
};
