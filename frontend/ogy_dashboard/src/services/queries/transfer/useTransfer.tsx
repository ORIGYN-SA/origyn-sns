import { useMutation } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
import { TRANSACTION_FEE } from "@constants/index";

const transfer = async ({
  ledgerActor,
  amount,
  to,
}: {
  ledgerActor: ActorSubclass;
  amount: bigint;
  to: string;
}) => {
  // https://forum.dfinity.org/t/difference-between-nnsledger-container-icrc1-transfer-and-transfer/20535/5
  const resultTransfer = await ledgerActor.icrc1_transfer({
    to: { owner: Principal.fromText(to), subaccount: [] },
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    amount: amount - BigInt(TRANSACTION_FEE),
  });
  return resultTransfer;
};

const useTransfer = () => {
  const [ledgerActor] = useCanister("ledger");

  return useMutation({
    mutationFn: ({ amount, to }: { amount: bigint; to: string }) =>
      transfer({
        ledgerActor,
        amount,
        to,
      }),
  });
};

export default useTransfer;
