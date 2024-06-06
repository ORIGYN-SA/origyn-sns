import rosettaAPI from "@services/api/rosetta";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

// interface ITransaction {
//   transactions: Array<{ block_identifier: { index: number } }>;
// }

export const fetchOneTransactionRosetta = async ({
  transactionId,
}: {
  transactionId: string;
}): Promise<string> => {
  const { data } = await rosettaAPI.post(
    `/search/transactions`,
    {
      network_identifier: {
        blockchain: "Internet Computer",
        network: SNS_LEDGER_CANISTER_ID,
      },
      transaction_identifier: { hash: transactionId },
    },
    { headers: { "content-type": "application/json" } }
  );
  return (data?.transactions[0]?.block_identifier?.index as string) ?? null;
};
