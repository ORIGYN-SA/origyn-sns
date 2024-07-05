import { Principal } from "@dfinity/principal";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { GetHoldersResponse } from "@services/types/token_metrics";
import { getActor } from "artemis-react";

interface ITokenHolderData {
  principal: string;
  total: number;
  ledgerBalance: number;
  governanceBalance: number;
  string: {
    total: string;
    governanceBalance: string;
    ledgerBalance: string;
  };
}

const fetchTokenHolders = async ({
  offset = 0,
  limit = 10,
  mergeAccountsToPrincipals = true,
}: {
  offset?: number;
  limit?: number;
  mergeAccountsToPrincipals?: boolean;
}) => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const results = (await actor.get_holders({
    limit,
    offset,
    merge_accounts_to_principals: mergeAccountsToPrincipals,
  })) as GetHoldersResponse;

  const data = results.data.map((result) => {
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
  return {
    totalHolders: Number(results.total_count),
    data: data as ITokenHolderData[],
  };
};

export default fetchTokenHolders;
