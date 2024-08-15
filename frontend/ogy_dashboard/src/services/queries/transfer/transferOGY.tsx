import { TRANSACTION_FEE } from "@constants/index";
import { getActor } from "@amerej/artemis-react";
import { decodeIcrcAccount } from "@dfinity/ledger-icrc";

const transferOGY = async ({ amount, to }: { amount: bigint; to: string }) => {
  // https://forum.dfinity.org/t/difference-between-nnsledger-container-icrc1-transfer-and-transfer/20535/5
  const actor = await getActor("ledger", { isAnon: false });

  const decodedAccount = decodeIcrcAccount(to);
  const owner = decodedAccount.owner;
  const subaccount = decodedAccount?.subaccount ?? [];

  const result = await actor.icrc1_transfer({
    to: { owner: owner, subaccount: subaccount },
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    amount: amount - BigInt(TRANSACTION_FEE),
  });
  return result;
};

export default transferOGY;
