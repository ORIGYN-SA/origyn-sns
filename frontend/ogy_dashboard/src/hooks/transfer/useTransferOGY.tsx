import { useMutation } from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import transferOGY from "@services/queries/transfer/transferOGY";

const useTransferOGY = () => {
  const [ledgerActor] = useCanister("ledger");

  return useMutation({
    mutationFn: ({ amount, to }: { amount: bigint; to: string }) =>
      transferOGY({
        ledgerActor,
        amount,
        to,
      }),
  });
};

export default useTransferOGY;
