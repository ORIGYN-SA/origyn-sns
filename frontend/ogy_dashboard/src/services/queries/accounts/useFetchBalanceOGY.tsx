// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";

import ogyAPI from "@services/api/ogy";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

interface IFetchBalanceOGY {
  actor: ActorSubclass;
  owner: string;
}

const fetchBalanceOGY = async ({ actor, owner }: IFetchBalanceOGY) => {
  const resultBalanceOgy = (await actor.icrc1_balance_of({
    owner: Principal.fromText(owner),
    subaccount: [],
  })) as number;

  const { data: dataOGYPrice } = await ogyAPI.get(`/price`);
  const { ogyPrice } = dataOGYPrice;

  const balanceOGY = divideBy1e8(resultBalanceOgy);
  const balanceOGYUSD = roundAndFormatLocale({ number: balanceOGY * ogyPrice });
  return {
    balanceOGYe8s: resultBalanceOgy,
    balanceOGY,
    balanceOGYUSD,
  };
};

const useFetchBalanceOGY = ({ enabled = true }: { enabled?: boolean }) => {
  const { principal, isConnected } = useConnect();
  const [ledgerActor] = useCanister("ledger");

  return useQuery({
    queryKey: ["userFetchBalanceOGY", ledgerActor, principal, isConnected],
    queryFn: () =>
      fetchBalanceOGY({ actor: ledgerActor, owner: principal as string }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!principal && !!enabled,
    refetchOnWindowFocus: !!enabled,
  });
};

export default useFetchBalanceOGY;
