// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";

const fn = async ({ actor, owner }) => {
  const result = await actor.icrc1_balance_of({
    owner: Principal.fromText(owner as string),
    subaccount: [],
  });
  return Number(result) / 10 ** 8;
};

const useCanisterFetchLegacyBalanceOGY = () => {
  const { principal, isConnected } = useConnect();
  const [ledgerActor] = useCanister("ledger");

  return useQuery({
    queryKey: ["fetchBalanceOGY", ledgerActor, principal, isConnected],
    queryFn: () => fn({ actor: ledgerActor, owner: principal }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!principal,
  });
};

export default useCanisterFetchLegacyBalanceOGY;
