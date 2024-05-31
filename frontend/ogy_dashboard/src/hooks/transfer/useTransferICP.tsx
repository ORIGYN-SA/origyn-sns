import { useMutation } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import transferICP from "@services/queries/transfer/transferICP";

const useTransferICP = () => {
  const [ledgerActor] = useCanister("ledgerICP");

  return useMutation({
    mutationFn: ({ amount, to }: { amount: bigint; to: string }) =>
      transferICP({
        ledgerActor,
        amount,
        to,
      }),
  });
};

export default useTransferICP;
