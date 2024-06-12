import { ActorSubclass } from "@dfinity/agent";
import { divideBy1e8 } from "@helpers/numbers/index";

const fetchAccountBalanceICP = async ({
  actor,
  account,
}: {
  actor: ActorSubclass;
  account: string;
}): Promise<number> => {
  const result = (await actor.account_balance_dfx({
    account,
  })) as { e8s: bigint };

  return divideBy1e8(result.e8s);
};

export default fetchAccountBalanceICP;
