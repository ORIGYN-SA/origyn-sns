// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { ActorSubclass } from "@dfinity/agent";
import ogyAPI from "@services/api/ogy";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

interface IFetchBalanceOGYLegacy {
  actor: ActorSubclass;
  owner: string;
}

export interface IBalanceOGYLegacy {
  balanceOGY: number;
  balanceOGYUSD: string;
}

const fetchBalanceOGYLegacy = async ({
  actor,
  owner,
}: IFetchBalanceOGYLegacy) => {
  const accountIdentifier = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
  });

  const { data: dataOGYPrice } = await ogyAPI.get(`/price`);
  const { ogyPrice } = dataOGYPrice;

  const result = (await actor.account_balance_dfx({
    account: accountIdentifier.toHex(),
  })) as { e8s: bigint };

  const balanceOGY = divideBy1e8(result.e8s);
  const balanceOGYUSD = roundAndFormatLocale({ number: balanceOGY * ogyPrice });

  return {
    balanceOGY,
    balanceOGYUSD,
  };
};

const useCanisterFetchBalanceOGYLegacy = () => {
  const { principal, isConnected } = useConnect();
  const [ledgerLegacyActor] = useCanister("ledgerLegacy");

  return useQuery({
    queryKey: [
      "fetchBalanceOGYLegacy",
      ledgerLegacyActor,
      principal,
      isConnected,
    ],
    queryFn: () =>
      fetchBalanceOGYLegacy({
        actor: ledgerLegacyActor,
        owner: principal as string,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!principal,
  });
};

export default useCanisterFetchBalanceOGYLegacy;
