import { useMutation } from "@tanstack/react-query";
import transferOGY from "@services/queries/transfer/transferOGY";
import { useWallet } from "@components/auth/useWallet";

const useTransferOGY = () => {
  const { subAccount } = useWallet();

  return useMutation({
    mutationFn: ({ amount, to }: { amount: bigint; to: string }) =>
      transferOGY({
        amount,
        to,
        fromSubaccount: subAccount,
      }),
  });
};

export default useTransferOGY;
