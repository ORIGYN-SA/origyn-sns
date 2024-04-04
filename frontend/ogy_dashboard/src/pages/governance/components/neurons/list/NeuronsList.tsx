import { useMemo, useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PaginationState, ColumnDef } from "@tanstack/react-table";
import { Table } from "@components/ui";

import { fetchData, Neuron } from "./fetchData.dev";

const NeuronsList = () => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<Neuron>[]>(
    () => [
      {
        accessorKey: "id",
        // accessorFn: (row) => row.id,
        id: "id",
        cell: (info) => info.getValue(),
        header: "ID",
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "state",
        // accessorFn: (row) => row.state,
        id: "state",
        cell: (info) => info.getValue(),
        header: "State",
      },
      {
        accessorKey: "stakedOGY",
        // accessorFn: (row) => row.stakedOGY,
        id: "stakedOgy",
        cell: (info) => info.getValue(),
        header: "Staked OGY",
      },
      {
        accessorKey: "maturity",
        // accessorFn: (row) => row.maturity,
        id: "maturity",
        cell: (info) => info.getValue(),
        header: "Maturity",
      },
      {
        accessorKey: "dissolveDelay",
        // accessorFn: (row) => row.dissolveDelay,
        id: "dissolveDelay",
        cell: (info) => info.getValue(),
        header: "Dissolve Delay",
      },
      {
        accessorKey: "age",
        // accessorFn: (row) => row.age,
        id: "age",
        cell: (info) => info.getValue(),
        header: "Age",
      },
      {
        accessorKey: "votingPower",
        // accessorFn: (row) => row.votingPower,
        id: "votingPower",
        cell: (info) => info.getValue(),
        header: "Voting Power",
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
    queryKey: ["data", pagination],
    queryFn: () => fetchData(pagination),
    placeholderData: keepPreviousData,
  });

  const handleClickView = (cell) => {
    navigate({
      pathname: "neurons/details",
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

export default NeuronsList;
