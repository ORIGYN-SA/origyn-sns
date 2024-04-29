/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import _truncate from "lodash/truncate";
import { Table, Tooltip, Badge } from "@components/ui";
import useFetchAllTransactions from "@services/transactions/fetchAll";
import { Transaction } from "@services/_api/types/transactions.types";
import { PaginationProps } from "@helpers/table/useTableProps";
import { timestampToDateShort } from "@helpers/dates";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";

const TransactionsList = ({
  pagination,
  setPagination,
  enablePagination,
  sorting,
  setSorting,
}: PaginationProps) => {
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
          className: "text-left",
        },
      },
      {
        accessorKey: "timestamp",
        id: "timestamp",
        cell: (info) => (
          <div>
            <Badge className="bg-slate-500/20">
              <div className="text-slate-500 text-xs font-semibold">
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
          <div>
            <button
              onClick={() => handleClickView(info)}
              data-tooltip-id="tooltip_from_account"
              data-tooltip-content={info.getValue()}
            >
              {_truncate(info.getValue(), { length: 30 })}
            </button>
            <Tooltip id="tooltip_from_account" />
          </div>
        ),
        header: "From",
      },
      {
        accessorKey: "to_account",
        id: "to_account",
        // cell: (info) => info.getValue(),
        cell: (info) => (
          <div>
            <button
              onClick={() => handleClickView(info)}
              data-tooltip-id="tooltip_to_account"
              data-tooltip-content={info.getValue()}
            >
              {_truncate(info.getValue(), { length: 30 })}
            </button>
            <Tooltip id="tooltip_to_account" />
          </div>
        ),
        header: "To",
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
          pagination={pagination}
          setPagination={setPagination}
          data={transactions}
          enablePagination={enablePagination}
          sorting={sorting}
          setSorting={setSorting}
        />
      )}
    </div>
  );
};

export default TransactionsList;
