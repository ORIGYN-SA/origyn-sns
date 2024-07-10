import { useMutation } from "@tanstack/react-query";
import transferOGY from "@services/queries/transfer/transferOGY";

const useTransferOGY = () => {
  return useMutation({
    mutationFn: ({ amount, to }: { amount: bigint; to: string }) =>
      transferOGY({
        amount,
        to,
      }),
  });
};

export default useTransferOGY;
