import { Overview } from "../declarations";

import { getActor } from "@amerej/artemis-react";

export const getAccountOverview = async ({
  accountId,
}: {
  accountId: string;
}): Promise<Overview | null> => {
  const actor = await getActor("tokenStats", { isAnon: true });
  const results = (await actor.get_account_overview(accountId)) as Overview[];
  return results && results.length ? (results[0] as Overview) : null;
};
