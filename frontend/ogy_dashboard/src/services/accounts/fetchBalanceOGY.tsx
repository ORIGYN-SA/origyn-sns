import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
import { divideBy1e8 } from "@helpers/numbers/index";
interface IFetchBalanceOGY {
  actor: ActorSubclass;
  owner: string;
  subaccount?: number[];
}

export const fetchBalanceOGY = async ({
  actor,
  owner,
  subaccount,
}: IFetchBalanceOGY) => {
  const resultBalanceOgy = (await actor.icrc1_balance_of({
    owner: Principal.fromText(owner),
    subaccount: [subaccount],
  })) as number;

  const balanceOGY = divideBy1e8(resultBalanceOgy);
  return {
    balanceOGYe8s: resultBalanceOgy,
    balanceOGY,
  };
};
