import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePagination, useSorting } from "@helpers/table/useTable";
import TransactionsList from "@pages/transactions/transactions-list/TransactionsList";
import Badge from "@components/ui/Badge";
import { LoaderSpin, Search } from "@components/ui";

import { useSearchExplorer } from "@hooks/explorer";

export const Explorer = () => {
  const navigate = useNavigate();
  const [pagination, setPagination] = usePagination({});
  const [searchParams] = useSearchParams();

  const [sorting, setSorting] = useSorting({
    id: "index",
    desc: true,
  });
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

  const search = useSearchExplorer({
    searchterm,
  });

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

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">Explorer</h1>
          <div className="flex gap-2 mt-8">
            <div>Search for: </div>
            {searchForItems.map(({ title, bgColorCn, colorCn }, index) => {
              return (
                <div key={index}>
                  <Badge className={`${bgColorCn} px-4`}>
                    <div className={`${colorCn} text-xs font-semibold`}>
                      {title}
                    </div>
                  </Badge>
                </div>
              );
            })}
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
        <TransactionsList
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
        />
      </div>
    </div>
  );
};
