import { useMutation } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
// import { TRANSACTION_FEE } from "@constants/index";
// import { getCurrentDateInNanoseconds } from "@helpers/dates";

interface IAmount {
  e8s: bigint;
}

interface ISendTokensParams {
  ledgerActor: ActorSubclass;
  // owner: string;
  amount: IAmount;
  to: string;
}

const transfer = async ({ ledgerActor, amount, to }: ISendTokensParams) => {
  // const fee = TRANSACTION_FEE;
  // const created_at_time = getCurrentDateInNanoseconds();

  // https://forum.dfinity.org/t/difference-between-nnsledger-container-icrc1-transfer-and-transfer/20535/5
  const resultTransfer = await ledgerActor.icrc1_transfer({
    to: { owner: Principal.fromText(to), subaccount: [] },
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    amount,
  });
  return resultTransfer;
};

const useTransfer = () => {
  // const { principal } = useConnect();
  const [ledgerActor] = useCanister("ledger");

  return useMutation({
    mutationFn: ({ amount, to }: { amount: IAmount; to: string }) =>
      transfer({
        ledgerActor,
        amount,
        to,
      }),
  });
};

export default useTransfer;
