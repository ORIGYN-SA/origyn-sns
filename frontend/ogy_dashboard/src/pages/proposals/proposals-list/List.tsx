import { useMemo, useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PaginationState, ColumnDef } from "@tanstack/react-table";
import { Table } from "@components/ui";

import { fetchData, Proposal } from "./fetchData.dev";

const List = () => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<Proposal>[]>(
    () => [
      {
        accessorKey: "id",
        // accessorFn: (row) => row.id,
        id: "id",
        cell: (info) => info.getValue(),
        header: "Principal ID",
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "title",
        // accessorFn: (row) => row.state,
        id: "title",
        cell: (info) => info.getValue(),
        header: "Title",
      },
      {
        accessorKey: "proposed",
        // accessorFn: (row) => row.stakedOGY,
        id: "proposed",
        cell: (info) => info.getValue(),
        header: "Proposed",
      },
      {
        accessorKey: "timeRemaining",
        // accessorFn: (row) => row.maturity,
        id: "timeRemaining",
        cell: (info) => info.getValue(),
        header: "Time Remaining",
      },
      {
        accessorKey: "topic",
        // accessorFn: (row) => row.dissolveDelay,
        id: "topic",
        cell: (info) => info.getValue(),
        header: "Topic",
      },
      {
        accessorKey: "status",
        // accessorFn: (row) => row.age,
        id: "status",
        cell: (info) => info.getValue(),
        header: "Status",
      },
      {
        header: "View",
        accessorKey: "view",
        cell: (props) => (
          <button onClick={() => handleClickView(props)}>view</button>
        ),
      },
    ],
    []
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const data = useQuery({
    queryKey: ["proposals_list", pagination],
    queryFn: () => fetchData(pagination),
    placeholderData: keepPreviousData,
  });

  const handleClickView = (cell) => {
    navigate({
      pathname: "/proposals/details",
      search: createSearchParams({ id: cell?.row?.original?.id }).toString(),
    });
  };

  return (
    <div>
      <Table
        columns={columns}
        pagination={pagination}
        setPagination={setPagination}
        data={data?.data}
        enablePagination={false}
      />
    </div>
  );
};

export default List;
