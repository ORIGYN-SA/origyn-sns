import { Principal } from "@dfinity/principal";
import { AccountIdentifier, type SubAccount } from "@dfinity/ledger-icp";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import { getActor } from "@services/actor";

const fetchBalanceOGYLegacy = async ({
  owner,
  subAccount,
}: {
  owner: string;
  subAccount?: SubAccount;
}) => {
  const account = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
    subAccount,
  }).toHex();

  // Anonymous read: account_balance_dfx is keyed by the account, no caller needed.
  const actor = await getActor("ledgerLegacy", { isAnon: true });
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
