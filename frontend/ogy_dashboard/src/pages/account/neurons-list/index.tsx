/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useMemo } from "react";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { Table, Tooltip, Badge, Button } from "@components/ui";
import { Transaction } from "@services/_api/types/transactions.types";
// import { ITableProps } from "@helpers/table/useTable";
// import { timestampToDateShort } from "@helpers/dates";
// import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";
import useNeuronsList from "./useNeuronsList";
import NeuronsDetails from "./neuron-details";
import { AddNeuronProvider, BtnAddNeuron, DialogAddNeuron } from "./add-neuron";
import {
  ClaimRewardProvider,
  BtnClaimReward,
  DialogClaimReward,
} from "./claim-reward";

const NeuronsList = () => {
  const columns = useMemo<ColumnDef<Transaction>[]>(
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
              <div>{getValue()}</div>
            </div>
          ) : (
            ""
          );
        },
        header: "My OGY Neurons",
        meta: {
          className: "",
        },
      },
      {
        accessorKey: "votingPower",
        id: "votingPower",
        cell: (info) => (
          <div>{info.getValue()}</div>
          // <div>
          //   <Badge className="bg-slate-500/20 px-2">
          //     <div className="text-slate-500 text-xs font-semibold shrink-0">
          //       {timestampToDateShort(info.getValue())}
          //     </div>
          //   </Badge>
          // </div>
        ),

        header: "",
      },
      {
        accessorKey: "claimAmount",
        id: "claimAmount",
        cell: ({ row, getValue }) => (
          <ClaimRewardProvider
            neuronId={row?.original?.id}
            claimAmount={getValue()}
          >
            <BtnClaimReward />
            <DialogClaimReward />
          </ClaimRewardProvider>
        ),
        header: "",
      },
      // {
      //   accessorKey: "dissolveDelay",
      //   id: "dissolveDelay",
      //   cell: (info) => <div>{info.getValue()}</div>,
      //   header: "",
      // },
      // {
      //   accessorKey: "age",
      //   id: "age",
      //   cell: (info) => <div>{info.getValue()}</div>,
      //   header: "",
      // },
      //   {
      //     accessorKey: "from_account",
      //     id: "from_account",
      //     cell: (info) => (
      //       <div className="flex items-center max-w-sm">
      //         <button
      //           onClick={() => handleClickView(info)}
      //           data-tooltip-id="tooltip_from_account"
      //           data-tooltip-content={info.getValue()}
      //           className="mr-2 truncate"
      //         >
      //           {info.getValue()}
      //         </button>
      //         <Tooltip id="tooltip_from_account" />
      //         <CopyToClipboard value={info.getValue()} />
      //       </div>
      //     ),
      //     header: "From",
      //     enableSorting: false,
      //   },
      //   {
      //     accessorKey: "to_account",
      //     id: "to_account",
      //     cell: (info) => (
      //       <div className="flex items-center max-w-sm">
      //         <button
      //           onClick={() => handleClickView(info)}
      //           data-tooltip-id="tooltip_to_account"
      //           data-tooltip-content={info.getValue()}
      //           className="truncate"
      //         >
      //           {info.getValue()}
      //         </button>
      //         <Tooltip id="tooltip_to_account" />
      //         <CopyToClipboard value={info.getValue()} />
      //       </div>
      //     ),
      //     header: "To",
      //     enableSorting: false,
      //   },
      //   {
      //     accessorKey: "amount",
      //     id: "amount",
      //     cell: (info) =>
      //       roundAndFormatLocale({
      //         number: divideBy1e8(parseInt(info.getValue())),
      //       }),
      //     header: "Amount",
      //   },
      //   {
      //     accessorKey: "fee",
      //     id: "fee",
      //     cell: (info) =>
      //       roundAndFormatLocale({
      //         number: divideBy1e8(parseInt(info.getValue())),
      //         decimals: 3,
      //       }),
      //     header: "Fee",
      //     enableSorting: false,
      //   },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { data: neuronsList, isSuccess: isSuccessGetNeuronsList } =
    useNeuronsList({
      // limit: pagination.pageSize,
      // offset: pagination.pageSize * pagination.pageIndex,
      // sorting,
    });

  // const handleClickView = (cell: CellContext<Transaction, unknown>) => {
  //   const columnId = cell.column?.id;
  //   const row = cell?.row?.original;
  //   const pathnames = {
  //     index: `/explorer/transactions/${row?.index}`,
  //     to_account: `/explorer/transactions/accounts/${row?.to_account}`,
  //     from_account: `/explorer/transactions/accounts/${row?.from_account}`,
  //   };
  //   navigate(pathnames[columnId]);
  //   return;
  // };

  // useEffect(() => {
  //   if (isSuccessGetNeuronsList) {
  //     // console.log(neuronsList);
  //   }
  // }, [isSuccessGetNeuronsList, neuronsList]);

  return (
    <div>
      {isSuccessGetNeuronsList && (
        <Table
          columns={columns}
          data={neuronsList}
          getRowCanExpand={() => true}
          subComponent={NeuronsDetails}
        />
      )}
      <div className="flex justify-center mt-4">
        <AddNeuronProvider>
          <BtnAddNeuron />
          <DialogAddNeuron />
        </AddNeuronProvider>
      </div>
    </div>
  );
};

export default NeuronsList;
