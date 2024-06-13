import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
import { TRANSACTION_FEE } from "@constants/index";

const transferOGY = async ({
  ledgerActor,
  amount,
  to,
}: {
  ledgerActor: ActorSubclass;
  amount: bigint;
  to: string;
}) => {
  // https://forum.dfinity.org/t/difference-between-nnsledger-container-icrc1-transfer-and-transfer/20535/5
  const result = await ledgerActor.icrc1_transfer({
    to: { owner: Principal.fromText(to), subaccount: [] },
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    amount: amount + BigInt(TRANSACTION_FEE),
  });
  return result;
};

export default transferOGY;
