import { Principal } from "@dfinity/principal";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import { getActor } from "@amerej/artemis-react";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

interface IFetchBalanceOGY {
  owner: string;
  subaccount?: string;
}

const fetchBalanceOGY = async ({ owner, subaccount }: IFetchBalanceOGY) => {
  const _subaccount = subaccount
    ? [[...Uint8Array.from(Buffer.from(subaccount, "hex"))]]
    : [];

  const actor = await getActor("ledger", { isAnon: true });
  const resultBalanceOgy = (await actor.icrc1_balance_of({
    owner: Principal.fromText(owner),
    subaccount: _subaccount,
  })) as number;

  const balance = divideBy1e8(resultBalanceOgy);
  return {
    balanceE8s: resultBalanceOgy,
    balance,
    string: {
      balance: roundAndFormatLocale({ number: balance }),
    },
  };
};

export default fetchBalanceOGY;
