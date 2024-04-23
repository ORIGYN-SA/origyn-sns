/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import _truncate from "lodash/truncate";
import { Table, Tooltip } from "@components/ui";
import useFetchAllTransactions from "@services/transactions/fetchAll";
import { Transaction } from "@services/_api/types/transactions.types";
import { PaginationProps } from "@helpers/table/useTableProps";

const TransactionsList = ({
  pagination,
  setPagination,
  enablePagination,
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
        accessorKey: "updated_at",
        id: "updated_at",
        cell: (info) => info.getValue(),
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
        cell: (info) => info.getValue(),
        header: "Amount",
      },
      {
        accessorKey: "fee",
        id: "fee",
        cell: (info) => info.getValue(),
        header: "Fee",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { data: transactions, isSuccess } = useFetchAllTransactions({
    limit: pagination.pageSize,
    offset: pagination.pageSize * pagination.pageIndex,
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
        />
      )}
    </div>
  );
};

export default TransactionsList;
