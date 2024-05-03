/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { Table, Tooltip, Badge } from "@components/ui";
import { Transaction } from "@services/_api/types/transactions.types";
import { ITableProps } from "@helpers/table/useTable";
import { timestampToDateShort } from "@helpers/dates";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import useAddNeuronOwnership from "@services/sns-rewards/useAddNeuronOwnership";
import useNeuronsList from "./useNeuronsList";

const NeuronsList = () => {
  const navigate = useNavigate();
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <button
              {...{
                onClick: row.getToggleExpandedHandler(),
                style: { cursor: "pointer" },
              }}
            >
              {row.getIsExpanded() ? "👇" : "👉"}
            </button>
          ) : (
            "🔵"
          );
        },
      },
      {
        accessorKey: "id",
        id: "id",
        cell: (info) => (
          <button onClick={() => handleClickView(info)}>
            {info.getValue()}
          </button>
        ),
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
        accessorKey: "dissolving",
        id: "dissolving",
        cell: (info) => <div>{info.getValue()}</div>,
        header: "",
      },
      {
        accessorKey: "dissolveDelay",
        id: "dissolveDelay",
        cell: (info) => <div>{info.getValue()}</div>,
        header: "",
      },
      {
        accessorKey: "age",
        id: "age",
        cell: (info) => <div>{info.getValue()}</div>,
        header: "",
      },
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

  const { mutate: addNeuronOwnership } = useAddNeuronOwnership();

  const handleClickView = (cell: CellContext<Transaction, unknown>) => {
    // const columnId = cell.column?.id;
    // const row = cell?.row?.original;
    // const pathnames = {
    //   index: `/explorer/transactions/${row?.index}`,
    //   to_account: `/explorer/transactions/accounts/${row?.to_account}`,
    //   from_account: `/explorer/transactions/accounts/${row?.from_account}`,
    // };
    // navigate(pathnames[columnId]);
    return;
  };

  const handleAddNeuronOwnership = ({ neuronId }: { neuronId: string }) => {
    addNeuronOwnership(
      {
        neuronId:
          "eecfbdb1b41f8bf9330ec897bdd1c3409c7162b6e322f53e6aeb14a821bbd70b",
      },
      {
        onSuccess: (data) => {
          console.log("success");
          console.log(data);
        },
        onError: (err) => {
          console.log("error");
          console.log(err);
        },
      }
    );
  };

  useEffect(() => {
    if (isSuccessGetNeuronsList) {
      console.log(neuronsList);
    }
  }, [isSuccessGetNeuronsList, neuronsList]);

  return (
    <div>
      <button onClick={handleAddNeuronOwnership}>Add neuron</button>
      {isSuccessGetNeuronsList && (
        <Table
          columns={columns}
          data={neuronsList}
          getRowCanExpand={() => true}
        />
      )}
    </div>
  );
};

export default NeuronsList;
