import { useNavigate } from "react-router-dom";
import { Card, Button, NewTable, SkeletonOverlay } from "@components/ui";
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
  const rows = isLoading || !isSuccess || !data ? SKELETON_ROWS : data.list.rows;

  return (
    <Card className={className} {...restProps}>
      <div className="flex items-center mb-8 gap-4">
        <div className="text-charcoal text-[22px] font-semibold leading-none">
          Transaction History
        </div>
        <Button
          onClick={() => navigate("/transaction-history")}
          className="min-w-fit ml-auto md:ml-0 !px-[25px] !py-0 text-[14px] leading-[40px]"
        >
          Show all
        </Button>
      </div>
      <SkeletonOverlay loading={isLoading}>
        <NewTable columns={columns} data={rows} />
      </SkeletonOverlay>
    </Card>
  );
};

export default TransactionHistory;
