/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import useConnect from "@hooks/useConnect";
import { Table, LoaderSpin } from "@components/ui";
import { INeuronData } from "@services/types";
import useNeurons from "@hooks/neurons/useNeuronsOwner";
import NeuronsDetails from "./neuron-details";
import { AddNeuronProvider, BtnAddNeuron, DialogAddNeuron } from "./add-neuron";
import {
  ClaimRewardProvider,
  BtnClaimReward,
  DialogClaimReward,
} from "./claim-reward";
import {
  RemoveNeuronProvider,
  BtnRemoveNeuron,
  DialogRemoveNeuron,
} from "./remove-neuron";

const NeuronsList = () => {
  const { principal: owner } = useConnect();

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
        accessorKey: "stakedAmount",
        id: "stakedAmount",
        cell: (info) => <div>{info.getValue()} OGY</div>,
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
      {
        accessorKey: "removeNeuron",
        id: "removeNeuron",
        cell: ({ row }) => (
          <RemoveNeuronProvider neuronId={row?.original?.id}>
            <BtnRemoveNeuron />
            <DialogRemoveNeuron />
          </RemoveNeuronProvider>
        ),
        header: "",
      },
    ],
    []
  );

  const {
    neuronsList,
    isSuccess: isSuccessGetNeuronsList,
    isLoading: isLoadingGetNeuronsList,
  } = useNeurons({
    // limit: pagination.pageSize,
    // offset: pagination.pageSize * pagination.pageIndex,
    // sorting,
    owner,
    limit: 0,
  });

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
      {isLoadingGetNeuronsList && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin />
        </div>
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
