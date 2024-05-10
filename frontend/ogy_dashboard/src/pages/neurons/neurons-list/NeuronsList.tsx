/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import {
  ColumnDef,
  PaginationState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table";
import { EyeIcon } from "@heroicons/react/24/outline";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Table, LoaderSpin, Tooltip, Badge } from "@components/ui";
import useNeurons from "@hooks/useNeurons";
import { INeuronData } from "@services/governance/listNeurons";

const NeuronsList = ({
  pagination,
  setPagination,
  sorting,
  setSorting,
}: {
  pagination?: PaginationState;
  setPagination?: OnChangeFn<PaginationState>;
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
}) => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<INeuronData>[]>(
    () => [
      {
        accessorKey: "id",
        id: "id",
        cell: (info) => (
          <div className="flex items-center max-w-sm">
            <div
              data-tooltip-id="tooltip_from_account"
              data-tooltip-content={info.getValue()}
              className="mr-2 truncate"
            >
              {info.getValue()}
            </div>
            <Tooltip id="tooltip_from_account" />
            <CopyToClipboard value={info.getValue()} />
          </div>
        ),
        header: "ID",
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "state",
        id: "state",
        cell: (info) => (
          <div>
            <Badge
              className={`bg-${
                info.getValue() === "Dissolving" ? "jade" : "sky"
              }/20 px-2`}
            >
              <div
                className={`text-${
                  info.getValue() === "Dissolving" ? "jade" : "sky"
                } text-xs font-semibold shrink-0`}
              >
                {info.getValue()}
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
    neuronsList,
    isSuccess: isSuccessGetNeuronsList,
    isLoading: isLoadingGetNeuronsList,
    // isError: isErrorGetNeuronsList,
    // error: errorGetNeuronsList,
  } = useNeurons({
    limit: pagination.pageSize,
  });

  const handleClickView = (cell) => {
    navigate({
      pathname: "/governance/neurons/details",
      search: createSearchParams({ id: cell?.row?.original?.id }).toString(),
    });
  };

  return (
    <div>
      {isSuccessGetNeuronsList && neuronsList && (
        <Table
          columns={columns}
          data={neuronsList}
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
        />
      )}
      {isLoadingGetNeuronsList && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin />
        </div>
      )}
    </div>
  );
};

export default NeuronsList;
