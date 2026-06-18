import { OverviewResponse as Overview } from "@hooks/token_metrics/declarations_files/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";
import { ApiAccountOverviewResponse } from "@services/api/gldt/v1/types";

const hasLedgerActivity = (
  ledger: ApiAccountOverviewResponse["overview"]["ledger"]
) => ledger.first_active !== 0 || ledger.last_active !== 0;

export const getPrincipalOverview = async ({
  principalId,
}: {
  principalId: string;
}): Promise<Overview | null> => {
  try {
    const { data } = await gldtAPI.get<ApiAccountOverviewResponse>(
      gldtTokenPath(`accounts/${encodeURIComponent(principalId)}/overview`)
    );
    const { ledger } = data.overview;
    if (!hasLedgerActivity(ledger)) return null;
    return {
      balance: toBigInt(ledger.balance),
      max_balance: toBigInt(ledger.max_balance),
      sent: [ledger.sent.count, toBigInt(ledger.sent.value)],
      received: [ledger.received.count, toBigInt(ledger.received.value)],
      first_active: toBigInt(ledger.first_active),
      last_active: toBigInt(ledger.last_active),
    };
  } catch {
    return null;
  }
};
