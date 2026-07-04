import { TablePagination } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { NftCard } from "@hooks/nft/mapNft";
import { NftTile, OnSelectNft, SkeletonTile } from "./NftCards";

const SKELETON_COUNT = 8;

interface NftGridProps {
  cards: NftCard[];
  isLoading: boolean;
  onSelect: OnSelectNft;
  total: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const NftGrid = ({
  cards,
  isLoading,
  onSelect,
  total,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: NftGridProps) => {
  const t = useT();
  const pageCount = Math.ceil(total / pageSize);

  if (!isLoading && total === 0) {
    return <p className="text-muted">{t("explorer.noResults")}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonTile key={i} />
            ))
          : cards.map((nft) => (
              <NftTile key={nft.id} nft={nft} onSelect={onSelect} />
            ))}
      </div>
      {pageCount > 1 && (
        <TablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
};

export default NftGrid;
