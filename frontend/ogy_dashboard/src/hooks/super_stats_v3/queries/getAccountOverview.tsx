import { OverviewResponse as Overview } from "@hooks/token_metrics/declarations_files/token_metrics";

import { getActor } from "@services/actor";

export const getAccountOverview = async ({
  accountId,
}: {
  accountId: string;
}): Promise<Overview | null> => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const results = (await actor.get_account_overview(accountId)) as Overview[];
  return results && results.length ? (results[0] as Overview) : null;
};
