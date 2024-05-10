// import { useMemo, Suspense } from "react";
// import { useLoaderData, defer, Await, RouteObject } from "react-router-dom";
import useConnect from "@hooks/useConnect";
import LedgerSwitch from "@pages/account/ledger-switch";
import AvailableOGY from "@pages/account/available-ogy";
import StakedOGY from "@pages/account/staked-ogy";
import StakedRewards from "@pages/account/staked-rewards";
import NeuronsList from "./neurons-list/index";

const loader = async () => {
  return null;
};

export const Account = () => {
  // const data = useLoaderData();
  const { principalShort } = useConnect();

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">Welcome back</h1>
        <div>{principalShort}</div>
      </div>
      <LedgerSwitch className="mb-8" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <AvailableOGY />
        <StakedOGY />
        <StakedRewards />
      </div>
      <div className="mt-8">
        <NeuronsList />
      </div>
    </div>
  );
};

Account.loader = loader;
