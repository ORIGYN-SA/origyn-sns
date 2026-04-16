/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NewTable, TablePagination } from "@components/ui";
import { TableSkeleton } from "@components/ui/NewTable";
import { Search } from "@components/ui";
import { useSearchExplorer } from "@hooks/explorer";
import useFetchAllTransactions from "@hooks/transactions/useFetchAllTransactions";
import {
  getTransactionColumns,
  buildSkeletonRows,
} from "@pages/transactions/transactionColumns";

export const Explorer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortDesc, setSortDesc] = useState(true);

  const searchterm = searchParams.get("searchterm") || "";

  const searchForItems = useMemo(
    () => [
      { title: "PrincipalID", bgColorCn: "bg-[#EDF8F4]", colorCn: "text-[#50BE8F]" },
      { title: "AccountID", bgColorCn: "bg-[#DCF3FF]", colorCn: "text-[#00A2F7]" },
      { title: "BlockIndex", bgColorCn: "bg-[#FFEBF8]", colorCn: "text-[#FF55C5]" },
    ],
    []
  );

  const search = useSearchExplorer({ searchterm });

  const { data, isSuccess, isLoading, isFetching } = useFetchAllTransactions({
    limit: pageSize,
    offset: pageSize * pageIndex,
    sorting: [{ id: "index", desc: sortDesc }],
  });

  const columns = getTransactionColumns(navigate);

  const pageCount = data?.list.pageCount ?? 0;

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

  return (
    <div className="max-w-[1440px] mx-auto py-16 px-6">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">
            Transaction History
          </h1>
          <div className="flex items-center gap-2 mt-6 justify-center flex-wrap text-sm text-[#69737C]">
            <span>Search for:</span>
            {searchForItems.map(({ title, bgColorCn, colorCn }, index) => (
              <div key={index} className="flex items-center gap-2">
                {index === searchForItems.length - 1 && <span>or</span>}
                <span className={`${bgColorCn} ${colorCn} text-xs font-semibold px-4 py-1 rounded-full`}>
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
        dropdown={
          (search.isSuccess || search.isError) ? (
            search.data ? (
              <button
                onClick={() =>
                  handleClickSearchResult(
                    search.data.type,
                    search.data.value
                  )
                }
                className="w-full h-10 flex items-center gap-3 px-2 rounded-xl text-left hover:bg-[#F5F5F5] transition-colors"
              >
                <span
                  className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${
                    search.data.type === "blockIndex"
                      ? "bg-[#FFEBF8] text-[#FF55C5]"
                      : "bg-[#EDF8F4] text-[#50BE8F]"
                  }`}
                >
                  {search.data.type === "blockIndex" ? "Block" : "Principal"}
                </span>
                <span className="truncate text-sm font-medium text-[#222526]">
                  {search.data.value}
                </span>
                <svg className="shrink-0 ml-auto" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="#69737C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <div className="h-10 flex items-center justify-center text-sm text-[#69737C]">
                No results found
              </div>
            )
          ) : (
            <div className="h-10 flex items-center gap-3 px-2 animate-pulse">
              <span className="shrink-0 h-6 w-16 rounded-full bg-muted/20" />
              <span className="h-4 w-full rounded bg-muted/20" />
            </div>
          )
        }
      />

      <div className="mt-16">
        <div className="flex items-center mb-4 gap-4">
          <button
            onClick={() => setSortDesc((d) => !d)}
            className="text-sm text-[#69737C] hover:text-[#222526] flex items-center gap-1"
          >
            Index {sortDesc ? "↓" : "↑"}
          </button>
        </div>
        {isFetching ? (
          <TableSkeleton>
            <NewTable columns={columns} data={buildSkeletonRows(pageSize)} footer={paginationFooter} />
          </TableSkeleton>
        ) : (
          isSuccess && data && (
            <NewTable
              columns={columns}
              data={data.list.rows}
              footer={paginationFooter}
            />
          )
        )}
      </div>
    </div>
  );
};
