// import { useEffect, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
// import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
// import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

interface IGetNeuronsByOwnerProps {
  snsRewardsActor: ActorSubclass;
}

export interface INeuronsByOwnerResult extends Array<{ id: number[] }> {}

// interface INeuronsByOwnerResponse extends Array<INeuronsByOwnerResult[]> {}

export const getNeuronsByOwner = async ({
  snsRewardsActor,
}: IGetNeuronsByOwnerProps) => {
  const result =
    (await snsRewardsActor.get_neurons_by_owner()) as INeuronsByOwnerResult[];
  return result[0] ?? [];
};

const useGetNeuronsByOwner = () => {
  const { isConnected } = useConnect();
  const [snsRewardsActor] = useCanister("SNSRewards");

  return {
    queryKey: ["userListNeuronsAll", snsRewardsActor, isConnected],
    queryFn: () =>
      getNeuronsByOwner({
        snsRewardsActor,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected,
  };
};

export default useGetNeuronsByOwner;
