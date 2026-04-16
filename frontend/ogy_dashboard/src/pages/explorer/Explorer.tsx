/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NewTable, TablePagination } from "@components/ui";
import { TableSkeleton } from "@components/ui/NewTable";
import Badge from "@components/ui/Badge";
import { LoaderSpin, Search } from "@components/ui";
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
      { title: "PrincipalID", bgColorCn: "bg-jade/20", colorCn: "text-jade" },
      {
        title: "Block index",
        bgColorCn: "bg-candyFloss/20",
        colorCn: "text-candyFloss",
      },
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
          <div className="flex gap-2 mt-8">
            <div>Search for: </div>
            {searchForItems.map(({ title, bgColorCn, colorCn }, index) => (
              <div key={index}>
                <Badge className={`${bgColorCn} px-4`}>
                  <div className={`${colorCn} text-xs font-semibold`}>
                    {title}
                  </div>
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Search id="search-explorer" className="max-w-2xl m-auto mt-8" />

      {searchterm !== "" && (
        <div className="mt-8">
          <div className="text-lg font-semibold">Search results</div>
          {search.isLoading && (
            <div className="mt-4">
              <LoaderSpin size="sm" />
            </div>
          )}
          {(search.isSuccess || search.isError) && (
            <div className="inline-block mt-4 bg-surface border border-border px-8 py-4 rounded-xl">
              {search.data && (
                <div className="max-w-64">
                  <div className="inline-block">
                    <Badge
                      className={`px-4 ${
                        search.data.type === "blockIndex"
                          ? "bg-candyFloss/20"
                          : "bg-jade/20"
                      }`}
                    >
                      <div
                        className={`text-xs font-semibold ${
                          search.data.type === "blockIndex"
                            ? "text-candyFloss"
                            : "text-jade"
                        }`}
                      >
                        {search.data.type}
                      </div>
                    </Badge>
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    <div
                      className="mt-4 text-center font-semibold truncate cursor-pointer"
                      onClick={() =>
                        handleClickSearchResult(
                          search.data.type,
                          search.data.value
                        )
                      }
                    >
                      {search.data.value}
                    </div>
                  </div>
                </div>
              )}
              {!search.data && (
                <div className="font-semibold">
                  <div>No results found</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
