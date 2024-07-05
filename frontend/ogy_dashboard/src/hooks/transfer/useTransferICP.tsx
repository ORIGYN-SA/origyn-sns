import { useMutation } from "@tanstack/react-query";
import transferICP from "@services/queries/transfer/transferICP";

const useTransferICP = () => {
  return useMutation({
    mutationFn: ({ amount, to }: { amount: bigint; to: string }) =>
      transferICP({
        amount,
        to,
      }),
  });
};

export default useTransferICP;
