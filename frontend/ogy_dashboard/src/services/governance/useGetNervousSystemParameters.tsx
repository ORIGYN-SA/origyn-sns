import { keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { ActorSubclass } from "@dfinity/agent";

interface IGetNervousSystemParameters {
  governanceActor: ActorSubclass;
}

export const getNervousSystemParameters = async ({
  governanceActor,
}: IGetNervousSystemParameters) => {
  const result = await governanceActor.get_nervous_system_parameters();
  return result;
};

const useGetNervousSystemParameters = () => {
  const { isConnected } = useConnect();
  const [governanceActor] = useCanister("governance");

  return {
    queryKey: ["getNervousSystemParameters", governanceActor, isConnected],
    queryFn: () =>
      getNervousSystemParameters({
        governanceActor,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected,
  };
};

export default useGetNervousSystemParameters;
