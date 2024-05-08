/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Table, Tooltip, Badge } from "@components/ui";
import useFetchAllTransactions from "@services/transactions/fetchAll";
import { Transaction } from "@services/_api/types/transactions.types";
import { TableProps } from "@helpers/table/useTable";
import { timestampToDateShort } from "@helpers/dates";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";
import CopyToClipboard from "@components/buttons/CopyToClipboard";

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
        accessorKey: "timestamp",
        id: "timestamp",
        cell: (info) => (
          <div>
            <Badge className="bg-slate-500/20 px-2">
              <div className="text-slate-500 text-xs font-semibold shrink-0">
                {timestampToDateShort(info.getValue())}
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
          <div className="flex items-center max-w-sm">
            <button
              onClick={() => handleClickView(info)}
              data-tooltip-id="tooltip_from_account"
              data-tooltip-content={info.getValue()}
              className="mr-2 truncate"
            >
              {info.getValue()}
            </button>
            <Tooltip id="tooltip_from_account" />
            <CopyToClipboard value={info.getValue()} />
          </div>
        ),
        header: "From",
        enableSorting: false,
      },
      {
        accessorKey: "to_account",
        id: "to_account",
        cell: (info) => (
          <div className="flex items-center max-w-sm">
            <button
              onClick={() => handleClickView(info)}
              data-tooltip-id="tooltip_to_account"
              data-tooltip-content={info.getValue()}
              className="truncate"
            >
              {info.getValue()}
            </button>
            <Tooltip id="tooltip_to_account" />
            <CopyToClipboard value={info.getValue()} />
          </div>
        ),
        header: "To",
        enableSorting: false,
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
        accessorKey: "fee",
        id: "fee",
        cell: (info) =>
          roundAndFormatLocale({
            number: divideBy1e8(parseInt(info.getValue())),
            decimals: 3,
          }),
        header: "Fee",
        enableSorting: false,
      },
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
          data={transactions}
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
