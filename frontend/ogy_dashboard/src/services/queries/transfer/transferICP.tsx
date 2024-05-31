import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { ActorSubclass } from "@dfinity/agent";
import { TRANSACTION_FEE_ICP } from "@constants/index";

const transferICP = async ({
  ledgerActor,
  amount,
  to,
}: {
  ledgerActor: ActorSubclass;
  amount: bigint;
  to: string;
}) => {
  const accountId = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(to),
  }).toHex();
  const result = await ledgerActor.send_dfx({
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
