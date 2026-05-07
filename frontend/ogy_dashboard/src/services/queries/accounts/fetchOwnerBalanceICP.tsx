import { Principal } from "@dfinity/principal";
import { AccountIdentifier, type SubAccount } from "@dfinity/ledger-icp";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import { getActor } from "@services/actor";

const fetchOwnerBalanceICP = async ({
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

  const actor = await getActor("ledgerICP", { isAnon: true });
  const result = (await actor.account_balance_dfx({
    account,
  })) as { e8s: bigint };

  const balance = divideBy1e8(result.e8s);
  return {
    balance: result,
    number: {
      balance: balance,
    },
    string: {
      balance: roundAndFormatLocale({ number: balance, decimals: 4 }),
    },
  };
};

export default fetchOwnerBalanceICP;
