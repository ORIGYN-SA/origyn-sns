/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { useWallet } from "@amerej/artemis-react";
import { Table, LoaderSpin, Card } from "@components/ui";
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
  const { principalId: owner } = useWallet();

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
        header: "ID",
        meta: {
          className: "",
        },
      },
      {
        accessorKey: "stakedAmount",
        id: "stakedAmount",
        cell: (info) => <div>{info.getValue()} OGY</div>,
        header: "Staked amount",
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
        header: "Claim amount",
      },
      {
        accessorKey: "removeNeuron",
        id: "removeNeuron",
        cell: () => (
          <RemoveNeuronProvider>
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
    isError: isErrorGetNeuronsList,
  } = useNeurons({
    owner,
    limit: 0,
  });

  return (
    <Card>
      <div className="flex items-center mb-8 gap-8">
        <div className="text-lg font-semibold">My OGY Neurons</div>
        <AddNeuronProvider>
          <BtnAddNeuron />
          <DialogAddNeuron />
        </AddNeuronProvider>
      </div>

      {(isLoadingGetNeuronsList || isErrorGetNeuronsList) && (
        <div className="flex items-center justify-center pt-4 pb-8">
          <LoaderSpin />
        </div>
      )}
      {isSuccessGetNeuronsList && neuronsList?.rows.length !== 0 && (
        <Table
          columns={columns}
          data={neuronsList}
          getRowCanExpand={() => true}
          subComponent={NeuronsDetails}
        />
      )}
      {isSuccessGetNeuronsList && !neuronsList?.rows.length && (
        <div className="flex items-center justify-center text-xl font-semibold pt-4 pb-8">
          No neurons added yet.
        </div>
      )}
    </Card>
  );
};

export default NeuronsList;
