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

const SearchDropdownSkeleton = () => (
  <div className="h-10 flex items-center gap-3 px-2" aria-busy="true">
    <div className="h-5 w-20 rounded-full bg-muted/10 animate-pulse" />
    <div className="h-4 flex-1 rounded-md bg-muted/10 animate-pulse" />
  </div>
);

export const Explorer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortDesc, setSortDesc] = useState(true);

  const searchterm = searchParams.get("searchterm") || "";

  const searchForItems = useMemo(
    () => [
      { title: "PrincipalID", bgColorCn: "bg-jade/10", colorCn: "text-jade" },
      { title: "AccountID", bgColorCn: "bg-sky/10", colorCn: "text-sky" },
      {
        title: "BlockIndex",
        bgColorCn: "bg-candyFloss/10",
        colorCn: "text-candyFloss",
      },
    ],
    []
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
      getTransactionColumns(navigate, {
        desc: sortDesc,
        onToggle: () => {
          setSortDesc((d) => !d);
          setPageIndex(0);
        },
      }),
    [navigate, sortDesc]
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
    navigate(pathnames[searchType]);
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
      No results found
    </div>
  ) : (
    <button
      onClick={() =>
        handleClickSearchResult(search.data.type, search.data.value)
      }
      className="w-full h-10 flex items-center gap-3 px-2 rounded-xl text-left hover:bg-surface-2 transition-colors"
    >
      <span
        className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${
          search.data.type === "blockIndex"
            ? "bg-candyFloss/10 text-candyFloss"
            : "bg-jade/10 text-jade"
        }`}
      >
        {search.data.type === "blockIndex" ? "Block" : "Principal"}
      </span>
      <span className="truncate text-sm font-medium text-content">
        {search.data.value}
      </span>
      <ChevronRightIcon className="shrink-0 ml-auto text-muted" />
    </button>
  );

  return (
    <div className="max-w-[1440px] mx-auto py-16 px-6">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">
            Transaction History
          </h1>
          <div className="flex items-center gap-2 mt-6 justify-center flex-wrap text-sm text-muted">
            <span>Search for:</span>
            {searchForItems.map(({ title, bgColorCn, colorCn }, index) => (
              <div key={index} className="flex items-center gap-2">
                {index === searchForItems.length - 1 && <span>or</span>}
                <span
                  className={`${bgColorCn} ${colorCn} text-xs font-semibold px-4 py-1 rounded-full`}
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
        placeholder="Search for an item"
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
          {hasError && <CardErrorOverlay title="Transaction History" />}
          <NewTable columns={columns} data={rows} footer={paginationFooter} />
        </SkeletonOverlay>
      </div>
    </div>
  );
};
