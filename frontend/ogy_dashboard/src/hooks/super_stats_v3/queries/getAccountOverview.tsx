import { OverviewResponse as Overview } from "@hooks/token_metrics/declarations_files/token_metrics";
import { getPrincipalOverview } from "./getPrincipalOverview";

export const getAccountOverview = ({
  accountId,
}: {
  accountId: string;
}): Promise<Overview | null> =>
  getPrincipalOverview({ principalId: accountId });
