import { useCanister } from "@amerej/connect2ic-react";

export const useGetActor = (name: string) => {
  const [actor] = useCanister(name);
  return actor;
};
