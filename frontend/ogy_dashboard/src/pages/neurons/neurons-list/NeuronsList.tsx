/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ReactNode, useMemo } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ColumnDef } from "@tanstack/react-table";
import { EyeIcon } from "@heroicons/react/24/outline";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Table, LoaderSpin, Tooltip, Badge } from "@components/ui";
import useNeurons from "@hooks/neurons/useNeuronsAll";
import { INeuronData } from "@services/types";
import NeuronsDetails from "./neuron-details";
import { TableProps } from "@helpers/table/useTable";

const NeuronsList = ({
  pagination,
  setPagination,
  sorting,
  setSorting,
}: TableProps) => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<INeuronData>[]>(
    () => [
      {
        accessorKey: "id",
        id: "id",
        cell: ({ row, getValue }) => {
          return row.getCanExpand() ? (
            <div className="flex items-center">
              <button
                {...{
                  onClick: row.getToggleExpandedHandler(),
                }}
                className="cursor-pointer mr-2"
              >
                {row.getIsExpanded() ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              <div className="flex items-center max-w-sm">
                <div
                  data-tooltip-id="tooltip_id"
                  data-tooltip-content={getValue()}
                  className="mr-2 truncate"
                >
                  {getValue() as ReactNode}
                </div>
                <Tooltip id="tooltip_id" />
                <CopyToClipboard value={getValue() as string} />
              </div>
            </div>
          ) : (
            ""
          );
        },
        header: "ID",
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "state",
        id: "state",
        cell: ({ getValue }) => (
          <div>
            <Badge
              className={`bg-${
                getValue() === "Dissolving" ? "jade" : "sky"
              }/20 py-2 px-2`}
            >
              <div
                className={`text-${
                  getValue() === "Dissolving" ? "jade" : "sky"
                } text-xs font-semibold shrink-0`}
              >
                {getValue() as ReactNode}
              </div>
            </Badge>
          </div>
        ),
        header: "State",
      },
      {
        accessorKey: "stakedOGY",
        id: "stakedOgy",
        cell: (info) => info.getValue(),
        header: "Staked OGY",
      },
      {
        accessorKey: "maturity",
        id: "maturity",
        cell: (info) => info.getValue(),
        header: "Maturity",
      },
      {
        accessorKey: "dissolveDelay",
        id: "dissolveDelay",
        cell: (info) => info.getValue(),
        header: "Dissolve Delay",
      },
      {
        accessorKey: "age",
        id: "age",
        cell: (info) => info.getValue(),
        header: "Age",
      },
      {
        accessorKey: "votingPower",
        id: "votingPower",
        cell: (info) => info.getValue(),
        header: "Voting Power",
      },
      {
        header: "View",
        accessorKey: "view",
        cell: (props) => (
          <div className="flex justify-center items-center shrink-0 rounded-full bg-surface border border-border hover:bg-surface-2 w-10 h-10">
            <button onClick={() => handleClickView(props)}>
              <EyeIcon className="h-5 w-5" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const {
    data,
    isSuccess: isSuccessGetNeuronsList,
    isLoading: isLoadingGetNeuronsList,
    isError: isErrorGetNeuronsList,
    error: errorGetNeuronsList,
  } = useNeurons({
    limit: pagination?.pageSize as number,
    offset: (pagination.pageSize * pagination.pageIndex) as number,
  });

  const handleClickView = (cell) => {
    navigate({
      pathname: "/governance/neurons/details",
      search: createSearchParams({ id: cell?.row?.original?.id }).toString(),
    });
  };

  return (
    <div>
      {isSuccessGetNeuronsList && data && (
        <Table
          columns={columns}
          data={data.list}
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
          getRowCanExpand={() => true}
          subComponent={NeuronsDetails}
        />
      )}
      {isLoadingGetNeuronsList && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin size="xl" />
        </div>
      )}
      {isErrorGetNeuronsList && (
        <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
          <div>{errorGetNeuronsList?.message}</div>
        </div>
      )}
    </div>
  );
};

export default NeuronsList;
