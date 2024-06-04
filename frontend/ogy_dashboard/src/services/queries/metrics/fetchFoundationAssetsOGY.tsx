import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import {
  ITokenHolderData,
  WalletOverview,
} from "@services/types/token_metrics";

const fetchFoundationAssetsOGY = async ({
  actor,
}: {
  actor: ActorSubclass;
}) => {
  const results = (await actor.get_foundation_assets()) as Array<
    [string, WalletOverview]
  >;
  console.log(results);
  return null;

  // const data = results.data.map((result) => {
  //   const principal = Principal.from(result[0].owner).toText();
  //   const total = Number(result[1].total);
  //   const ledgerBalance = Number(result[1].ledger.balance);
  //   const governanceBalance = total - ledgerBalance;

  //   return {
  //     principal,
  //     total,
  //     ledgerBalance,
  //     governanceBalance,
  //     string: {
  //       total: roundAndFormatLocale({
  //         number: divideBy1e8(total),
  //       }),
  //       governanceBalance: roundAndFormatLocale({
  //         number: divideBy1e8(governanceBalance),
  //       }),
  //       ledgerBalance: roundAndFormatLocale({
  //         number: divideBy1e8(ledgerBalance),
  //       }),
  //     },
  //   };
  // });
  // return {
  //   totalHolders: Number(results.total_count),
  //   data: data as ITokenHolderData[],
  // };
};

export default fetchFoundationAssetsOGY;
