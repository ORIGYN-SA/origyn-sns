// import { useEffect, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
// import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
// import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

interface IGetNeuronsByOwner {
  snsRewardsActor: ActorSubclass;
}

export const getNeuronsByOwner = async ({
  snsRewardsActor,
}: IGetNeuronsByOwner) => {
  const result = await snsRewardsActor.get_neurons_by_owner();
  return result;
};

const useGetNeuronsByOwner = () => {
  const { isConnected } = useConnect();
  const [snsRewardsActor] = useCanister("SNSRewards");

  return {
    queryKey: ["getNeuronsByOwner", snsRewardsActor, isConnected],
    queryFn: () =>
      getNeuronsByOwner({
        snsRewardsActor,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected,
  };
};

export default useGetNeuronsByOwner;
