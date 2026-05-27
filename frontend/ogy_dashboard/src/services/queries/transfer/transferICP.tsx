import { Principal } from "@dfinity/principal";
import { AccountIdentifier, type SubAccount } from "@dfinity/ledger-icp";
import { TRANSACTION_FEE_ICP } from "@constants/index";
import { getActor } from "@services/actor";
import { requireVariant } from "@services/queries/utils/variant";

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
  });
  const actor = await getActor("ledgerICP", { isAnon: false });
  // Use transfer, not the deprecated send_dfx: the ICP ledger only exposes an
  // ICRC-21 consent message for transfer, which OISY needs to sign the call.
  const result = await actor.transfer({
    to: accountId.toUint8Array(),
    fee: {
      e8s: BigInt(TRANSACTION_FEE_ICP),
    },
    memo: 0n,
    from_subaccount: fromSubaccount ? [fromSubaccount.toUint8Array()] : [],
    created_at_time: [],
    amount: { e8s: amount },
  });
  return requireVariant<bigint>(result, "Ok", "ICP transfer failed");
};

export default transferICP;
