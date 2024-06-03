import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { ActorSubclass } from "@dfinity/agent";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

const fetchOwnerBalanceICP = async ({
  actor,
  owner,
}: {
  actor: ActorSubclass;
  owner: string;
}) => {
  const account = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
  }).toHex();

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
