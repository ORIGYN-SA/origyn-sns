import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NewTable, TablePagination, SkeletonOverlay } from "@components/ui";
import { Search } from "@components/ui";
import { ChevronRightIcon } from "@components/ui/icons";
import { useSearchExplorer } from "@hooks/explorer";
import useFetchAllTransactions from "@hooks/transactions/useFetchAllTransactions";
import {
  getTransactionColumns,
  buildSkeletonRows,
} from "@pages/transactions/transactionColumns";

const FAKE_SEARCH_RESULT = {
  type: "principalId" as const,
  value: "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaa",
};

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
  const hasSearchResult = searchSettled && !!search.data;

  const { data, isSuccess, isFetching } = useFetchAllTransactions({
    limit: pageSize,
    offset: pageSize * pageIndex,
    sorting: [{ id: "index", desc: sortDesc }],
  });

  const columns = getTransactionColumns(navigate);
  const pageCount = data?.list.pageCount ?? 0;
  const rows =
    isFetching || !isSuccess || !data ? buildSkeletonRows(pageSize) : data.list.rows;

  const handleClickSearchResult = (
    searchType: "blockIndex" | "principalId",
    value: string
  ) => {
    const pathnames = {
      blockIndex: `/explorer/transactions/${value}`,
      principalId: `/explorer/transactions/accounts/${value}`,
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

  const searchResult = hasSearchResult ? search.data : FAKE_SEARCH_RESULT;

  const searchDropdown =
    searchSettled && !search.data ? (
      <div className="h-10 flex items-center justify-center text-sm text-muted">
        No results found
      </div>
    ) : (
      <SkeletonOverlay loading={!searchSettled}>
        <button
          onClick={() =>
            hasSearchResult &&
            handleClickSearchResult(searchResult.type, searchResult.value)
          }
          className="w-full h-10 flex items-center gap-3 px-2 rounded-xl text-left hover:bg-surface-2 transition-colors"
        >
          <span
            className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${
              searchResult.type === "blockIndex"
                ? "bg-candyFloss/10 text-candyFloss"
                : "bg-jade/10 text-jade"
            }`}
          >
            {searchResult.type === "blockIndex" ? "Block" : "Principal"}
          </span>
          <span className="truncate text-sm font-medium text-content">
            {searchResult.value}
          </span>
          <ChevronRightIcon className="shrink-0 ml-auto text-muted" />
        </button>
      </SkeletonOverlay>
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
      />

      <div className="mt-16">
        <div className="flex items-center mb-4 gap-4">
          <button
            onClick={() => setSortDesc((d) => !d)}
            className="text-sm text-muted hover:text-content flex items-center gap-1"
          >
            Index {sortDesc ? "↓" : "↑"}
          </button>
        </div>
        <SkeletonOverlay loading={isFetching}>
          <NewTable columns={columns} data={rows} footer={paginationFooter} />
        </SkeletonOverlay>
      </div>
    </div>
  );
};
