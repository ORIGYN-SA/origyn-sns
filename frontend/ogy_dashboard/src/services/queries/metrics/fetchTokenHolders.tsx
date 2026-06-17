import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import gldtAPI from "@services/api/gldt/v1";
import { ApiHoldersListResponse } from "@services/api/gldt/v1/types";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";

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

const principalFromAccount = (account: string) => account.split(".")[0];

const fetchTokenHolders = async ({
  offset = 0,
  limit = 10,
  mergeAccountsToPrincipals = true,
}: {
  offset?: number;
  limit?: number;
  mergeAccountsToPrincipals?: boolean;
}) => {
  const { data: results } = await gldtAPI.get<ApiHoldersListResponse>(
    gldtTokenPath("holders/list", {
      limit,
      offset,
      merge: mergeAccountsToPrincipals,
    })
  );

  const data = results.data.map((result) => {
    const principal = principalFromAccount(result.account);
    const total = Number(result.overview.total);
    const ledgerBalance = Number(result.overview.ledger.balance);
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
