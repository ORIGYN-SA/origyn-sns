import { useParams } from "react-router-dom";
import { usePagination, useSorting } from "@helpers/table/useTable";
import List from "@pages/transactions/transactions-account-list";

const TxHistory = () => {
  const params = useParams();
  const [pagination, setPagination] = usePagination({
    pageSize: 10,
    pageIndex: 0,
  });
  const [sorting, setSorting] = useSorting({
    id: "index",
    desc: true,
  });

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">
            Transactions history
          </h1>
          <p className="mt-6 text-content/60">
            List of transactions history for the account{" "}
            <span className="font-semibold">{params.accountId}</span>
          </p>
        </div>
      </div>
      <div className="my-16">
        <List
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
          accountId={params.accountId as string}
        />
      </div>
    </div>
  );
};

export default TxHistory;
