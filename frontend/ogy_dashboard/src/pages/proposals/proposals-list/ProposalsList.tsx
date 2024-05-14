/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ReactNode, useMemo } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ColumnDef } from "@tanstack/react-table";
import { EyeIcon } from "@heroicons/react/24/outline";
// import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Table, LoaderSpin, Tooltip, Badge } from "@components/ui";
import useProposals from "@hooks/proposals/useProposalsAll";
import { IProposalData } from "@services/types";
import ProposalDetails from "./proposal-details";
import { TableProps } from "@helpers/table/useTable";
import { getColorByProposalStatus } from "@helpers/colors/getColorByProposalStatus";

const List = ({
  pagination,
  setPagination,
  sorting,
  setSorting,
}: TableProps) => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<IProposalData>[]>(
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
                <div className="mr-2 truncate">{getValue() as ReactNode}</div>
              </div>
            </div>
          ) : (
            ""
          );
        },
        header: "Proposal ID",
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "title",
        id: "title",
        cell: ({ getValue }) => (
          <div className="flex items-center max-w-sm">
            <div
              data-tooltip-id="tooltip_title"
              data-tooltip-content={getValue()}
              className="mr-2 truncate font-semibold"
            >
              {getValue() as ReactNode}
            </div>
            <Tooltip id="tooltip_title" />
          </div>
        ),
        header: "Title",
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "proposed",
        id: "proposed",
        cell: (info) => info.getValue(),
        header: "Proposed",
      },
      {
        accessorKey: "timeRemaining",
        id: "timeRemaining",
        cell: ({ getValue }) => (
          <div className="font-semibold">{getValue()}</div>
        ),
        header: "Time Remaining",
      },
      {
        accessorKey: "topic",
        id: "topic",
        cell: ({ getValue }) => (
          <div>
            <Badge className={`bg-spacePurple/20 py-2 px-2`}>
              <div
                className={`text-spacePurple text-xs font-semibold shrink-0`}
              >
                {getValue() as ReactNode}
              </div>
            </Badge>
          </div>
        ),
        header: "Topic",
      },
      {
        accessorKey: "status",
        id: "status",
        cell: ({ getValue }) => (
          <div>
            <Badge
              className={`bg-${getColorByProposalStatus(
                getValue()
              )}/20 py-2 px-2`}
            >
              <div
                className={`text-${getColorByProposalStatus(
                  getValue()
                )} text-xs font-semibold shrink-0`}
              >
                {getValue() as ReactNode}
              </div>
            </Badge>
          </div>
        ),
        header: "Status",
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
    isSuccess: isSuccessGetProposalsList,
    isLoading: isLoadingGetProposalsList,
    isError: isErrorGetProposalsList,
    error: errorGetProposalsList,
  } = useProposals({
    limit: pagination?.pageSize as number,
    offset: (pagination.pageSize * pagination.pageIndex) as number,
  });

  const handleClickView = (cell) => {
    navigate({
      pathname: "/proposals/details",
      search: createSearchParams({ id: cell?.row?.original?.id }).toString(),
    });
  };

  return (
    <div>
      {isSuccessGetProposalsList && data && (
        <Table
          columns={columns}
          data={data.list}
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
          getRowCanExpand={() => true}
          subComponent={ProposalDetails}
        />
      )}
      {isLoadingGetProposalsList && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin />
        </div>
      )}
      {isErrorGetProposalsList && (
        <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
          <div>{errorGetProposalsList?.message}</div>
        </div>
      )}
    </div>
  );
};

export default List;
