/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { Card, Button, NewTable } from "@components/ui";
import { TableSkeleton } from "@components/ui/NewTable";
import useFetchAllTransactions from "@hooks/transactions/useFetchAllTransactions";
import {
  getTransactionColumns,
  buildSkeletonRows,
} from "@pages/transactions/transactionColumns";

const SKELETON_ROWS = buildSkeletonRows(10);

const TransactionHistory = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const navigate = useNavigate();
  const { data, isSuccess, isLoading } = useFetchAllTransactions({
    limit: 10,
    offset: 0,
    sorting: [{ id: "index", desc: true }],
  });

  const columns = getTransactionColumns(navigate);

  return (
    <Card className={className} {...restProps}>
      <div className="flex items-center mb-8 gap-4">
        <div className="text-charcoal text-[22px] font-semibold leading-none">
          Transaction History
        </div>
        <Button
          onClick={() => navigate("/explorer")}
          className="min-w-fit ml-auto md:ml-0 !px-[25px] !py-0 text-[14px] leading-[40px]"
        >
          Show all
        </Button>
      </div>
      {isLoading && (
        <TableSkeleton>
          <NewTable columns={columns} data={SKELETON_ROWS} />
        </TableSkeleton>
      )}
      {isSuccess && data && (
        <NewTable columns={columns} data={data.list.rows} />
      )}
    </Card>
  );
};

export default TransactionHistory;
