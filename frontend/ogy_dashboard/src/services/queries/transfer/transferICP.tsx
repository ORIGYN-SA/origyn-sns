import { Principal } from "@dfinity/principal";
import { AccountIdentifier, type SubAccount } from "@dfinity/ledger-icp";
import { TRANSACTION_FEE_ICP } from "@constants/index";
import { getActor } from "@services/actor";

const transferICP = async ({
  amount,
  to,
  fromSubaccount,
}: {
  amount: bigint;
  to: string;
  fromSubaccount?: SubAccount;
}) => {
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
    from_subaccount: fromSubaccount ? [fromSubaccount.toUint8Array()] : [],
    created_at_time: [],
    amount: { e8s: amount },
  });
  return result;
};

export default transferICP;
