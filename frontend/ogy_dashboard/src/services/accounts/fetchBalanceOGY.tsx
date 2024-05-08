import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
import ogyAPI from "@services/_api/ogy";
import { divideBy1e8 } from "@helpers/numbers/index";
interface IFetchBalanceOGY {
  actor: ActorSubclass;
  owner: string;
  subaccount: string[];
}

export const fetchBalanceOGY = async ({
  actor,
  owner,
  subaccount,
}: IFetchBalanceOGY) => {
  const resultBalanceOgy = (await actor.icrc1_balance_of({
    owner: Principal.fromText(owner),
    subaccount,
  })) as number;

  const balanceOGY = divideBy1e8(resultBalanceOgy);
  return {
    balanceOGYe8s: resultBalanceOgy,
    balanceOGY,
  };
};

export const fetchBalanceWithPriceOGY = async ({
  actor,
  owner,
  subaccount,
}: IFetchBalanceOGY) => {
  const resultBalanceOgy = (await actor.icrc1_balance_of({
    owner: Principal.fromText(owner),
    subaccount,
  })) as number;

  const { data: dataOGYPrice } = await ogyAPI.get(`/price`);
  const { ogyPrice } = dataOGYPrice;

  const balanceOGY = divideBy1e8(resultBalanceOgy);
  return {
    balanceOGYe8s: resultBalanceOgy,
    balanceOGY,
    balanceOGYUSD: balanceOGY * ogyPrice,
  };
};
