/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Table, Tooltip, Skeleton, TooltipInfo } from "@components/ui";
import useTokenDistribution from "@hooks/metrics/useTokenDistribution";
import { IProposalData } from "@services/types";
import { TableProps } from "@helpers/table/useTable";

const TokenDistributionList = ({
  pagination,
  setPagination,
  sorting,
  setSorting,
}: TableProps) => {
  const navigate = useNavigate();
  const columns = useMemo<ColumnDef<IProposalData>[]>(
    () => [
      {
        accessorKey: "principal",
        id: "principal",
        cell: ({ getValue, row }) => (
          <div className="flex items-center md:max-w-sm max-w-64">
            <>
              <button
                data-tooltip-id="tooltip_address"
                data-tooltip-content={getValue()}
                className="mr-2 truncate"
                onClick={() =>
                  navigate(`/explorer/transactions/accounts/${getValue()}`)
                }
              >
                {getValue()}
              </button>
            </>
            <CopyToClipboard value={getValue()} />

            {row?.original?.tag && (
              <div className="ml-3">
                <TooltipInfo
                  id={`tooltip_${row?.original?.tag}`}
                  clickable={false}
                >
                  {row?.original?.tag}
                </TooltipInfo>
              </div>
            )}
          </div>
        ),
        header: "Address",
        meta: {
          className: "text-left",
        },
      },
      {
        accessorKey: "total",
        id: "total",
        cell: ({ getValue }) => getValue(),
        header: "Total",
      },
      {
        accessorKey: "governanceBalance",
        id: "governanceBalance",
        cell: ({ getValue }) => <div className="">{getValue()}</div>,
        header: "Governance Balance",
      },
      {
        accessorKey: "ledgerBalance",
        id: "ledgerBalance",
        cell: ({ getValue }) => <div className="">{getValue()}</div>,
        header: "Ledger Balance",
      },
      {
        accessorKey: "weight",
        id: "weight",
        cell: ({ getValue }) => <div className="">{getValue()}</div>,
        header: "Weight In Total Supply",
      },
      // {
      //   header: "View",
      //   accessorKey: "view",
      //   cell: (props) => (
      //     <div className="flex justify-center items-center shrink-0 rounded-full bg-surface border border-border hover:bg-surface-2 w-10 h-10">
      //       <button onClick={() => handleClickView(props)}>
      //         <EyeIcon className="h-5 w-5" />
      //       </button>
      //     </div>
      //   ),
      // },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const {
    data,
    isSuccess: isSuccessFetchTokenHolders,
    isLoading: isLoadingFetchTokenHolders,
    isError: isErrorFetchTokenHolders,
    error: errorFetchTokenHolders,
  } = useTokenDistribution({
    limit: pagination?.pageSize as number,
    offset: (pagination.pageSize * pagination.pageIndex) as number,
  });

  // const handleClickView = (cell) => {
  //   navigate({
  //     pathname: "/proposals/details",
  //     search: createSearchParams({ id: cell?.row?.original?.id }).toString(),
  //   });
  // };

  return (
    <div>
      {isSuccessFetchTokenHolders && data && (
        <Table
          columns={columns}
          data={data.list}
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
        />
      )}
      {isLoadingFetchTokenHolders && <Skeleton count={10} height={52} />}
      {isErrorFetchTokenHolders && (
        <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
          <div>{errorFetchTokenHolders?.message}</div>
        </div>
      )}
      <Tooltip id="tooltip_address" />
    </div>
  );
};

export default TokenDistributionList;
