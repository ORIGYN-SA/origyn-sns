// import { useMemo, Suspense } from "react";
// import { useLoaderData, defer, Await } from "react-router-dom";
import useTableProps from "@helpers/table/useTableProps";
import TransactionsList from "@pages/transactions/transactions-list/TransactionsList";

const loader = async () => {
  return null;
};

export const Explorer = () => {
  // const data = useLoaderData();
  const { pagination, setPagination, enablePagination } = useTableProps({});

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">Explorer</h1>
        </div>
      </div>
      <div className="mt-16">
        <TransactionsList
          pagination={pagination}
          setPagination={setPagination}
          enablePagination={enablePagination}
        />
      </div>
    </div>
  );
};

Explorer.loader = loader;