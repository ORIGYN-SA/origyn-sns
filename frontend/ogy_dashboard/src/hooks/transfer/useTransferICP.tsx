import { useMutation } from "@tanstack/react-query";
import transferICP from "@services/queries/transfer/transferICP";
import { useWallet } from "@components/auth/useWallet";

const useTransferICP = () => {
  const { subAccount } = useWallet();

  return useMutation({
    mutationFn: ({ amount, to }: { amount: bigint; to: string }) =>
      transferICP({
        amount,
        to,
        fromSubaccount: subAccount,
      }),
  });
};

export default useTransferICP;
