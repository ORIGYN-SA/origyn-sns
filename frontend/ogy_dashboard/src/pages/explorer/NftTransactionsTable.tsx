import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewTable, SkeletonOverlay, TablePagination } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import useNftTransactions from "@hooks/nft/useNftTransactions";
import {
  buildNftTransactionSkeletonRows,
  getNftTransactionColumns,
  NftTransactionColumnOptions,
} from "./nftTransactionColumns";

const DEFAULT_PAGE_SIZE = 10;

type NftTransactionsTableProps = NftTransactionColumnOptions & {
  account?: string | null;
  collection?: string | null;
  tokenId?: string | null;
  title?: string;
  className?: string;
  defaultPageSize?: number;
  hideWhenEmpty?: boolean;
};

const NftTransactionsTable = ({
  account,
  collection,
  tokenId,
  title,
  className,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  hideWhenEmpty = false,
  showCertificate,
  showCollection,
  showDirection,
}: NftTransactionsTableProps) => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const { items, total, isLoading, isPlaceholderData, isError } =
    useNftTransactions({
      account: account ?? undefined,
      collection: collection ?? undefined,
      tokenId: tokenId ?? undefined,
      limit: pageSize,
      offset: pageSize * pageIndex,
    });

  const columns = useMemo(
    () =>
      getNftTransactionColumns((path) => navigate(lp(path)), t, {
        showCertificate,
        showCollection,
        showDirection,
      }),
    [navigate, lp, t, showCertificate, showCollection, showDirection]
  );

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || isPlaceholderData || hasError;
  const isEmpty = !showSkeleton && total === 0;
  const pageCount = Math.ceil(total / pageSize);
  const showPagination = showSkeleton || pageCount > 1;

  if (isEmpty && hideWhenEmpty) return null;

  return (
    <section className={className}>
      {title && (
        <h2 className="text-explorer-section font-semibold leading-none text-content mb-6">
          {title}
        </h2>
      )}
      {isEmpty ? (
        <p className="text-muted">{t("explorer.transactions.empty")}</p>
      ) : (
        <div className="relative">
          <SkeletonOverlay loading={showSkeleton}>
            {hasError && (
              <CardErrorOverlay title={t("explorer.sections.transactions")} />
            )}
            <NewTable
              columns={columns}
              data={
                showSkeleton ? buildNftTransactionSkeletonRows(pageSize) : items
              }
              footer={
                showPagination ? (
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
                ) : null
              }
            />
          </SkeletonOverlay>
        </div>
      )}
    </section>
  );
};

export default NftTransactionsTable;
