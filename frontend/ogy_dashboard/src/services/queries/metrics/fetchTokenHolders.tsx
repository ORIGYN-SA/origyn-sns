import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import {
  Account,
  WalletOverview,
  ITokenHolderData,
} from "@services/types/token_metrics";

const fetchTokenHolders = async ({
  actor,
  offset = 0,
  limit = 10,
  mergeAccountsToPrincipals = true,
}: {
  actor: ActorSubclass;
  offset?: number;
  limit?: number;
  mergeAccountsToPrincipals?: boolean;
}) => {
  const results = (await actor.get_holders({
    limit,
    offset,
    merge_accounts_to_principals: mergeAccountsToPrincipals,
  })) as Array<[Account, WalletOverview]>;

  const data = results.map((result) => {
    const principal = Principal.from(result[0].owner).toText();
    const total = Number(result[1].total);
    const ledgerBalance = Number(result[1].ledger.balance);
    const governanceBalance = total - ledgerBalance;

    return {
      principal,
      total,
      ledgerBalance,
      governanceBalance,
      string: {
        total: roundAndFormatLocale({
          number: divideBy1e8(total),
        }),
        governanceBalance: roundAndFormatLocale({
          number: divideBy1e8(governanceBalance),
        }),
        ledgerBalance: roundAndFormatLocale({
          number: divideBy1e8(ledgerBalance),
        }),
      },
    };
  });
  return data as ITokenHolderData[];
};

export default fetchTokenHolders;
