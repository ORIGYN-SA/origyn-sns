import { useMemo, useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PaginationState, ColumnDef } from "@tanstack/react-table";
import { Table } from "@components/ui";

import { fetchData, Transaction } from "./fetchData.dev";

const List = () => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "index",
        // accessorFn: (row) => row.id,
        id: "index",
        cell: (props) => (
          <button onClick={() => handleClickView(props)}>
            {props.getValue()}
          </button>
        ),
        header: "Index",
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "date",
        // accessorFn: (row) => row.state,
        id: "date",
        cell: (info) => info.getValue(),
        header: "Date",
      },
      {
        accessorKey: "from",
        // accessorFn: (row) => row.stakedOGY,
        id: "from",
        // cell: (info) => info.getValue(),
        cell: (props) => (
          <button onClick={() => handleClickView(props)}>
            {props.getValue()}
          </button>
        ),
        header: "From",
      },
      {
        accessorKey: "to",
        // accessorFn: (row) => row.maturity,
        id: "to",
        // cell: (info) => info.getValue(),
        cell: (props) => (
          <button onClick={() => handleClickView(props)}>
            {props.getValue()}
          </button>
        ),
        header: "To",
      },
      {
        accessorKey: "amount",
        // accessorFn: (row) => row.dissolveDelay,
        id: "amount",
        cell: (info) => info.getValue(),
        header: "Amount",
      },
      {
        accessorKey: "fee",
        // accessorFn: (row) => row.age,
        id: "fee",
        cell: (info) => info.getValue(),
        header: "Fee",
      },
    ],
    []
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const data = useQuery({
    queryKey: ["transactions_list", pagination],
    queryFn: () => fetchData(pagination),
    placeholderData: keepPreviousData,
  });

  const handleClickView = (cell) => {
    const columnId = cell.column?.id;
    navigate({
      pathname: `/explorer/${
        columnId === "index" ? "transaction-details" : "account-details"
      }`,
      search: createSearchParams({ id: cell?.row?.original?.id }).toString(),
    });
  };

  return (
    <div>
      <Table
        columns={columns}
        pagination={pagination}
        setPagination={setPagination}
        data={data}
      />
    </div>
  );
};

export default List;
