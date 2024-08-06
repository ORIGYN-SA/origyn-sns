// import { useMemo } from "react";
// import { useLoaderData, defer, Await } from "react-router-dom";
import { usePagination, useSorting } from "@helpers/table/useTable";
import TransactionsList from "@pages/transactions/transactions-list/TransactionsList";
// import Badge from "@components/ui/Badge";
// import { Search } from "@components/ui";

import { useSearchExplorer } from "@hooks/explorer";

const loader = async () => {
  return null;
};

export const Explorer = () => {
  // const data = useLoaderData();
  const [pagination, setPagination] = usePagination({});
  const [sorting, setSorting] = useSorting({
    id: "index",
    desc: true,
  });
  // const searchForItems = useMemo(
  //   () => [
  //     { title: "PrincipalID", bgColorCn: "bg-jade/20", colorCn: "text-jade" },
  //     {
  //       title: "Block index",
  //       bgColorCn: "bg-candyFloss/20",
  //       colorCn: "text-candyFloss",
  //     },
  //   ],
  //   []
  // );

  // "4uwdt-f5sls-li6d7-hhkjy-3mc6v-bfzuz-77z2e-7avcd-vc6od-ceoke-eqe"
  // "39916"
  const t = useSearchExplorer({
    searchterm: "39916",
  });

  console.log(t);

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">Explorer</h1>
          {/* <div className="flex gap-2 mt-8">
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
          </div> */}
        </div>
      </div>

      {/* <Search id="search-explorer" className="max-w-2xl m-auto mt-8" /> */}
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

Explorer.loader = loader;
