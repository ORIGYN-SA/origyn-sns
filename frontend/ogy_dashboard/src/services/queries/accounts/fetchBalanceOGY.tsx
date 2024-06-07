import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

interface IFetchBalanceOGY {
  actor: ActorSubclass;
  owner: string;
  subaccount?: string;
}

const fetchBalanceOGY = async ({
  actor,
  owner,
  subaccount,
}: IFetchBalanceOGY) => {
  const _subaccount = subaccount
    ? [[...Uint8Array.from(Buffer.from(subaccount, "hex"))]]
    : [];

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
