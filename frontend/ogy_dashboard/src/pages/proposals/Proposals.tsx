// import { useMemo, Suspense } from "react";
// import { useLoaderData, defer, Await } from "react-router-dom";
// import { Card, Button } from "@components/ui";
// import EstimateRewards from "@pages/governance/estimate-rewards/EstimateRewards";
// import TokensInGovernanceTotal, {
//   TokensInGovernanceProps,
// } from "@pages/governance/tokens-in-governance-total/TokensInGovernanceTotal";
// import TokensInGovernanceKpi, {
//   TokensInGovernanceKpiProps,
// } from "@pages/governance/tokens-in-governance-kpi/TokensInGovernanceKPI";
// import NeuronsList from "@pages/neurons/neurons-list/NeuronsList";
import ProposalsList from "@pages/proposals/proposals-list/List";

const loader = async () => {
  return null;
};

export const Proposals = () => {
  // const data = useLoaderData();

  //   const governanceFeatures = useMemo(
  //     () => [
  //       {
  //         title: "Stake & Vote",
  //         description:
  //           "Influence the ORIGYN Network by staking OGY & voting on proposals.",
  //         icon: "",
  //       },
  //       {
  //         title: "Earn Rewards",
  //         description:
  //           "Participate in the decision-making process to earn rewards.",
  //         icon: "",
  //       },
  //       {
  //         title: "Govern Collectively",
  //         description:
  //           "Engage & influence the network as a collaborative ecosystem.",
  //         icon: "",
  //       },
  //     ],
  //     []
  //   );

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-bold">Proposals</h1>
          <p className="mt-6 text-content/60">
            Holders of OGY tokens can directly influence the ORIGYN Network by
            staking their OGY and voting on proposals. By participating in the
            decision-making process, these staked token holders earn rewards.
          </p>
        </div>
      </div>
      <div className="mt-8 mb-16">
        <ProposalsList />
      </div>
    </div>
  );
};

Proposals.loader = loader;
