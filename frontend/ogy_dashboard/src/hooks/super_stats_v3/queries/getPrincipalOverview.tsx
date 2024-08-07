import { Overview } from "../declarations";

import { getActor } from "@amerej/artemis-react";

export const getPrincipalOverview = async ({
  principalId,
}: {
  principalId: string;
}): Promise<Overview | null> => {
  const actor = await getActor("tokenStats", { isAnon: true });
  const results = (await actor.get_principal_overview(
    principalId
  )) as Overview[];
  return results && results.length ? (results[0] as Overview) : null;
};
