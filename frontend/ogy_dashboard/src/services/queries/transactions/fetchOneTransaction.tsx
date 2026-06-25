import gldtAPI from "@services/api/gldt/v1";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";
import { ApiTransaction } from "@services/api/gldt/v1/types";
import { Transaction } from "@services/types/transactions.types";
import { mapApiTransaction } from "@services/queries/transactions/utils";

export const fetchOneTransaction = async ({
  transactionId,
}: {
  transactionId: string;
}): Promise<Transaction> => {
  const { data } = await gldtAPI.get<ApiTransaction>(
    gldtTokenPath(`transactions/${encodeURIComponent(transactionId)}`)
  );
  return mapApiTransaction(data);
};
