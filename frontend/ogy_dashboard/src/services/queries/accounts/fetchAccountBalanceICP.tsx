import { divideBy1e8 } from "@helpers/numbers/index";
import { getActor } from "@amerej/artemis-react";

const fetchAccountBalanceICP = async ({
  account,
}: {
  account: string;
}): Promise<number> => {
  const actor = await getActor("ledgerICP", { isAnon: true });
  const result = (await actor.account_balance_dfx({
    account,
  })) as { e8s: bigint };

  return divideBy1e8(result.e8s);
};

export default fetchAccountBalanceICP;
