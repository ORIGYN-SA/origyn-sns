/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Table, Tooltip, Badge } from "@components/ui";
import useFetchAllTransactions from "@hooks/transactions/useFetchAllTransactions";
import { Transaction } from "@services/types/transactions.types";
import { TableProps } from "@helpers/table/useTable";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import getBadgeTransactionKind from "@helpers/badge/getBadgeTransactionKind";

const TransactionsList = ({
  pagination,
  setPagination,
  sorting,
  setSorting,
}: TableProps) => {
  const navigate = useNavigate();
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "index",
        id: "index",
        cell: (info) => (
          <button onClick={() => handleClickView(info)}>
            {info.getValue()}
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
            number: divideBy1e8(parseInt(info.getValue())),
          }),
        header: "Amount",
      },
      {
        accessorKey: "kind",
        id: "kind",
        cell: ({ getValue }) => (
          <div>{getBadgeTransactionKind(getValue())}</div>
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
                {info.getValue()}
              </div>
            </Badge>
          </div>
        ),
        header: "Date",
      },
      {
        accessorKey: "from_account",
        id: "from_account",
        cell: (info) => (
          <div className="flex items-center max-w-64">
            {info.getValue() && info.getValue() === "Minting account" && (
              <div> {info.getValue()}</div>
            )}
            {info.getValue() && info.getValue() !== "Minting account" && (
              <>
                <button
                  onClick={() => handleClickView(info)}
                  data-tooltip-id="tooltip_from_account"
                  data-tooltip-content={info.getValue()}
                  className="mr-2 truncate"
                >
                  {info.getValue()}
                </button>
                <CopyToClipboard value={info.getValue()} />
              </>
            )}
          </div>
        ),
        header: "From",
        enableSorting: false,
      },
      {
        accessorKey: "to_account",
        id: "to_account",
        cell: (info) => (
          <div className="flex items-center max-w-64">
            {info.getValue() && info.getValue() === "Minting account" && (
              <div> {info.getValue()}</div>
            )}
            {info.getValue() && info.getValue() !== "Minting account" && (
              <>
                <button
                  onClick={() => handleClickView(info)}
                  data-tooltip-id="tooltip_to_account"
                  data-tooltip-content={info.getValue()}
                  className="truncate"
                >
                  {info.getValue()}
                </button>
                <CopyToClipboard value={info.getValue()} />
              </>
            )}
          </div>
        ),
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

  const handleClickView = (cell: CellContext<Transaction, unknown>) => {
    const columnId = cell.column?.id;
    const row = cell?.row?.original;
    const pathnames = {
      index: `/explorer/transactions/${row?.index}`,
      to_account: `/explorer/transactions/accounts/${row?.to_account}`,
      from_account: `/explorer/transactions/accounts/${row?.from_account}`,
    };
    navigate(pathnames[columnId]);
  };

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
      <Tooltip id="tooltip_from_account" />
      <Tooltip id="tooltip_to_account" />
    </div>
  );
};

export default TransactionsList;
