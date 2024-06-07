import rosettaAPI from "@services/api/rosetta";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

export const fetchOneTransactionRosetta = async ({
  transactionId,
}: {
  transactionId: string;
}): Promise<string> => {
  const { data } = await rosettaAPI.post(
    "/search/transaction",
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
