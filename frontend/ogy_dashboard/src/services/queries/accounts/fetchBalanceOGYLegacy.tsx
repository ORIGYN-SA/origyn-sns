import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import { getActor } from "artemis-react";

const fetchBalanceOGYLegacy = async ({ owner }: { owner: string }) => {
  const account = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
  }).toHex();

  const actor = await getActor("ledgerLegacy", { isAnon: false });
  const result = (await actor.account_balance_dfx({
    account,
  })) as { e8s: bigint };

  const balance = divideBy1e8(result.e8s);
  return {
    balanceE8s: result.e8s,
    balance,
    string: {
      balance: roundAndFormatLocale({ number: divideBy1e8(balance) }),
    },
  };
};

export default fetchBalanceOGYLegacy;
