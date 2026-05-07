import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Table, Tooltip, Badge } from "@components/ui";
import useFetchAllTransactions from "@hooks/transactions/useFetchAllTransactions";
import { TransactionRow } from "@pages/transactions/transactionColumns";
import { TableProps } from "@helpers/table/useTable";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import getBadgeTransactionKind from "@helpers/badge/getBadgeTransactionKind";

type TransactionsListProps = Required<TableProps>;

const TransactionsList = ({
  pagination,
  setPagination,
  sorting,
  setSorting,
}: TransactionsListProps) => {
  const navigate = useNavigate();
  const handleClickView = (cell: CellContext<TransactionRow, unknown>) => {
    const columnId = cell.column?.id as keyof TransactionRow;
    const row = cell?.row?.original;
    if (!row) return;
    const pathnames: Partial<Record<keyof TransactionRow, string>> = {
      index: `/transaction-history/transactions/${row.index}`,
      to_account: `/transaction-history/transactions/accounts/${row.to_account}`,
      from_account: `/transaction-history/transactions/accounts/${row.from_account}`,
    };
    const path = pathnames[columnId];
    if (path) navigate(path);
  };

  const columns = useMemo<ColumnDef<TransactionRow>[]>(
    () => [
      {
        accessorKey: "index",
        id: "index",
        cell: (info) => (
          <button onClick={() => handleClickView(info)}>
            {info.getValue<number>()}
          </button>
        ),
        header: "Index",
        meta: {
          className: "",
        },
      },
      {
        accessorKey: "amount",
        id: "amount",
        cell: (info) =>
          roundAndFormatLocale({
            number: divideBy1e8(parseInt(info.getValue<string>())),
          }),
        header: "Amount",
      },
      {
        accessorKey: "kind",
        id: "kind",
        cell: ({ getValue }) => (
          <div>{getBadgeTransactionKind(getValue<string>())}</div>
        ),
        header: "Type",
      },
      {
        accessorKey: "timestamp",
        id: "timestamp",
        cell: (info) => (
          <div>
            <Badge className="bg-slate-500/20 px-2">
              <div className="text-slate-500 text-xs font-semibold shrink-0">
                {info.getValue<string>()}
              </div>
            </Badge>
          </div>
        ),
        header: "Date",
      },
      {
        accessorKey: "from_account",
        id: "from_account",
        cell: (info) => {
          const value = info.getValue<string>();
          return (
            <div className="flex items-center max-w-64">
              {value && value === "Minting account" && <div> {value}</div>}
              {value && value !== "Minting account" && (
                <>
                  <Tooltip content={value}>
                    <button
                      onClick={() => handleClickView(info)}
                      className="mr-2 truncate"
                    >
                      {value}
                    </button>
                  </Tooltip>
                  <CopyToClipboard value={value} />
                </>
              )}
            </div>
          );
        },
        header: "From",
        enableSorting: false,
      },
      {
        accessorKey: "to_account",
        id: "to_account",
        cell: (info) => {
          const value = info.getValue<string>();
          return (
            <div className="flex items-center max-w-64">
              {value && value === "Minting account" && <div> {value}</div>}
              {value && value !== "Minting account" && (
                <>
                  <Tooltip content={value}>
                    <button
                      onClick={() => handleClickView(info)}
                      className="truncate"
                    >
                      {value}
                    </button>
                  </Tooltip>
                  <CopyToClipboard value={value} />
                </>
              )}
            </div>
          );
        },
        header: "To",
        enableSorting: false,
      },
      // {
      //   accessorKey: "fee",
      //   id: "fee",
      //   cell: (info) =>
      //     roundAndFormatLocale({
      //       number: divideBy1e8(parseInt(info.getValue())),
      //       decimals: 3,
      //     }),
      //   header: "Fee",
      //   enableSorting: false,
      // },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { data: transactions, isSuccess } = useFetchAllTransactions({
    limit: pagination.pageSize,
    offset: pagination.pageSize * pagination.pageIndex,
    sorting,
  });

  return (
    <div>
      {isSuccess && (
        <Table
          columns={columns}
          data={transactions.list}
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
        />
      )}
    </div>
  );
};

export default TransactionsList;
