import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { ActorSubclass } from "@dfinity/agent";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

interface IFetchBalanceOGYLegacy {
  actor: ActorSubclass;
  owner: string;
}

const fetchBalanceOGYLegacy = async ({
  actor,
  owner,
}: IFetchBalanceOGYLegacy) => {
  const accountIdentifier = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
  });

  const result = (await actor.account_balance_dfx({
    account: accountIdentifier.toHex(),
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
