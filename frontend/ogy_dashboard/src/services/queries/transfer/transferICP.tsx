import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { TRANSACTION_FEE_ICP } from "@constants/index";
import { getActor } from "artemis-react";

const transferICP = async ({ amount, to }: { amount: bigint; to: string }) => {
  const accountId = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(to),
  }).toHex();
  const actor = await getActor("ledgerICP", { isAnon: false });
  const result = await actor.send_dfx({
    to: accountId,
    fee: {
      e8s: BigInt(TRANSACTION_FEE_ICP),
    },
    memo: 0n,
    from_subaccount: [],
    created_at_time: [],
    amount: { e8s: amount },
  });
  return result;
};

export default transferICP;
