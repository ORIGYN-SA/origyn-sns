import rosettaAPI from "../services";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

export const fetchOneTransaction = async ({
  transactionId,
}: {
  transactionId: string;
}): Promise<string> => {
  const { data } = await rosettaAPI.post(
    "/search/transactions",
    {
      network_identifier: {
        blockchain: "Internet Computer",
        network: SNS_LEDGER_CANISTER_ID,
      },
      transaction_identifier: {
        hash: transactionId,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return (data?.transactions[0]?.block_identifier?.index as string) ?? null;
};
