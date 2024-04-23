// import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { ActorSubclass } from "@dfinity/agent";
interface IFetchBalanceOGYLegacy {
  actor: ActorSubclass;
  owner: string;
}

const fetchBalanceOGYLegacy = async ({
  actor,
  owner,
}: IFetchBalanceOGYLegacy) => {
  const accountIdentifier = AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(owner),
  });
  const result = (await actor.account_balance_dfx({
    account: accountIdentifier.toHex(),
  })) as { e8s: bigint };
  return Number(result.e8s) / 10 ** 8;
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
