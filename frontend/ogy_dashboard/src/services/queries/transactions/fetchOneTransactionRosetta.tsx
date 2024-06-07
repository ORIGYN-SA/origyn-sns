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
    "/search/transactions",
    JSON.stringify({
      network_identifier: {
        blockchain: "Internet Computer",
        network: "lkwrt-vyaaa-aaaaq-aadhq-cai",
      },
      transaction_identifier: {
        hash: "c741830b2b83bb6ef884935de58b2fa748d66fd56706670463ede96a7b8b5ccb",
      },
    }),
    {
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    }
  );
  return (data?.transactions[0]?.block_identifier?.index as string) ?? null;
};
