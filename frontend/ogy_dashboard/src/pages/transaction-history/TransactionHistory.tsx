import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NewTable, TablePagination, SkeletonOverlay } from "@components/ui";
import { Search } from "@components/ui";
import { ChevronRightIcon } from "@components/ui/icons";
import { CardErrorOverlay } from "@components/dashboard";
import { useSearchExplorer } from "@hooks/explorer";
import useFetchAllTransactions from "@hooks/transactions/useFetchAllTransactions";
import {
  getTransactionColumns,
  buildSkeletonRows,
} from "@pages/transactions/transactionColumns";
import { useT, useLocalePath } from "@i18n/LocaleContext";

const SearchDropdownSkeleton = () => (
  <div className="h-10 flex items-center gap-3 px-2" aria-busy="true">
    <div className="h-5 w-20 rounded-full bg-muted/10 animate-pulse" />
    <div className="h-4 flex-1 rounded-md bg-muted/10 animate-pulse" />
  </div>
);

export const TransactionHistory = () => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const navTo = (path: string) => navigate(lp(path));
  const [searchParams] = useSearchParams();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortDesc, setSortDesc] = useState(true);

  const searchterm = searchParams.get("searchterm") || "";

  const searchForItems = useMemo(
    () => [
      {
        title: t("transactions.history.searchTypes.principalId"),
        className:
          "border border-jade/25 bg-jade/10 text-emerald-700 dark:text-emerald-300",
      },
      {
        title: t("transactions.history.searchTypes.accountId"),
        className:
          "border border-sky/25 bg-sky/10 text-sky-700 dark:text-sky-300",
      },
      {
        title: t("transactions.history.searchTypes.blockIndex"),
        className:
          "border border-candyFloss/25 bg-candyFloss/10 text-pink-700 dark:text-pink-300",
      },
    ],
    [t]
  );

  const search = useSearchExplorer({ searchterm });
  const searchSettled = search.isSuccess || search.isError;

  const { data, isLoading, isFetching, isError } = useFetchAllTransactions({
    limit: pageSize,
    offset: pageSize * pageIndex,
    sorting: [{ id: "index", desc: sortDesc }],
  });

  const hasError = !isFetching && isError;
  const showSkeleton = isFetching || hasError;

  const columns = useMemo(
    () =>
      getTransactionColumns(navTo, t, {
        desc: sortDesc,
        onToggle: () => {
          setSortDesc((d) => !d);
          setPageIndex(0);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, lp, t, sortDesc]
  );
  const pageCount = data?.list.pageCount ?? 0;
  const rows =
    showSkeleton || isLoading || !data?.list.rows
      ? buildSkeletonRows(pageSize)
      : data.list.rows;

  const handleClickSearchResult = (
    searchType: "blockIndex" | "principalId",
    value: string
  ) => {
    const pathnames = {
      blockIndex: `/transaction-history/transactions/${value}`,
      principalId: `/transaction-history/transactions/accounts/${value}`,
    };
    navTo(pathnames[searchType]);
  };

  const goToPage = (next: number) => setPageIndex(next);
  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPageIndex(0);
  };

  const paginationFooter = (
    <TablePagination
      pageIndex={pageIndex}
      pageSize={pageSize}
      pageCount={pageCount}
      onPageChange={goToPage}
      onPageSizeChange={handlePageSizeChange}
    />
  );

  const searchDropdown = !searchSettled ? (
    <SearchDropdownSkeleton />
  ) : !search.data ? (
    <div className="h-10 flex items-center justify-center text-sm text-muted">
      {t("transactions.history.noResults")}
    </div>
  ) : (
    <button
      onClick={() =>
        handleClickSearchResult(search.data.type, search.data.value)
      }
      className="w-full h-10 flex items-center gap-3 px-2 rounded-xl text-start hover:bg-surface-2 transition-colors"
    >
      <span
        className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${
          search.data.type === "blockIndex"
            ? "border border-candyFloss/25 bg-candyFloss/10 text-pink-700 dark:text-pink-300"
            : "border border-jade/25 bg-jade/10 text-emerald-700 dark:text-emerald-300"
        }`}
      >
        {search.data.type === "blockIndex"
          ? t("transactions.history.resultBlock")
          : t("transactions.history.resultPrincipal")}
      </span>
      <span dir="ltr" className="truncate text-sm font-medium text-content">
        {search.data.value}
      </span>
      <ChevronRightIcon className="shrink-0 ms-auto text-muted" />
    </button>
  );

  return (
    <div className="max-w-[1440px] mx-auto py-16 px-6">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">
            {t("transactions.history.title")}
          </h1>
          <div className="flex items-center gap-2 mt-6 justify-center flex-wrap text-sm text-muted">
            <span>{t("transactions.history.searchFor")}</span>
            {searchForItems.map(({ title, className }, index) => (
              <div key={index} className="flex items-center gap-2">
                {index === searchForItems.length - 1 && (
                  <span>{t("transactions.history.or")}</span>
                )}
                <span
                  className={`${className} text-xs font-semibold px-4 py-1 rounded-full`}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Search
        id="search-explorer"
        placeholder={t("transactions.history.searchPlaceholder")}
        className="max-w-2xl m-auto mt-8"
        dropdown={searchDropdown}
        onEnter={
          search.data
            ? () => handleClickSearchResult(search.data.type, search.data.value)
            : undefined
        }
      />

      <div className="relative mt-16">
        <SkeletonOverlay loading={showSkeleton}>
          {hasError && (
            <CardErrorOverlay title={t("transactions.history.title")} />
          )}
          <NewTable columns={columns} data={rows} footer={paginationFooter} />
        </SkeletonOverlay>
      </div>
    </div>
  );
};
