// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import ogyAPI from "@services/_api/ogy";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

const fn = async ({ actor, owner }) => {
  const resultBalanceOgy = await actor.icrc1_balance_of({
    owner: Principal.fromText(owner as string),
    subaccount: [],
  });

  const { data: dataOGYPrice } = await ogyAPI.get(`/price`);
  const { ogyPrice } = dataOGYPrice;

  const balanceOGY = divideBy1e8(resultBalanceOgy);
  const balanceOGYUSD = roundAndFormatLocale({ number: balanceOGY * ogyPrice });
  return {
    balanceOGY,
    balanceOGYUSD,
  };
};

const useFetchBalanceOGY = () => {
  const { principal, isConnected } = useConnect();
  const [ledgerActor] = useCanister("ledger");

  return useQuery({
    queryKey: ["fetchBalanceOGY", ledgerActor, principal, isConnected],
    queryFn: () => fn({ actor: ledgerActor, owner: principal }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!principal,
  });
};

export default useFetchBalanceOGY;
