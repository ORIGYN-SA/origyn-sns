/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo, Suspense } from "react";
import { useLoaderData, defer, Await, useNavigate } from "react-router-dom";
import { Card, Button } from "@components/ui";
import EstimateRewards from "@pages/governance/estimate-rewards/EstimateRewards";
import TokensInGovernanceTotal from "@pages/governance/tokens-in-governance-total/TokensInGovernanceTotal"; // TokensInGovernanceProps,
import TokensInGovernanceKpi from "@pages/governance/tokens-in-governance-kpi/TokensInGovernanceKPI"; // TokensInGovernanceKpiProps,
import NeuronsList from "@pages/neurons/neurons-list/NeuronsList";
import ProposalsList from "@pages/proposals/proposals-list/List";
import { usePagination } from "@helpers/table/useTable";

const loader = async () => {
  // tokens in governance total
  const dataTokensInGovernanceTotal = new Promise((resolve) => {
    setTimeout(() => {
      // reject(new Error("data error!"));
      resolve({
        tokensInGovernance: [
          {
            name: "Locked",
            value: 2678857678.32,
          },
          {
            name: "Unlocked",
            value: 524002220.01,
          },
          {
            name: "Accumulated Rewards",
            value: 202397569.16,
          },
        ],
        tokensInGovernanceTotal: 4261654417.77,
        colors: ["#34d399", "#1d7555", "#7bf8ca"],
      });
    }, 500);
  });

  // tokens in governance KPI's
  const dataTokensInGovernanceKpi = new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "Proposals", value: "20192" },
        { name: "Reward Base for the current year", value: "250,000,000" },
        { name: "Daily Voting Rewards", value: "684,289" },
        { name: "Average Voting Power", value: "794'992'323" },
        { name: "Total Voting Power", value: "1'232'238'366" },
        { name: "Overall Voting Participation", value: "1'232'238'366" },
      ]);
    }, 300);
  });

  return defer({
    dataTokensInGovernanceTotal: await dataTokensInGovernanceTotal,
    dataTokensInGovernanceKpi,
    // error: error,
  });
};

export const Governance = () => {
  const data = useLoaderData();
  const navigate = useNavigate();

  const governanceFeatures = useMemo(
    () => [
      {
        title: "Stake & Vote",
        description:
          "Influence the ORIGYN Network by staking OGY & voting on proposals.",
        icon: "",
      },
      {
        title: "Earn Rewards",
        description:
          "Participate in the decision-making process to earn rewards.",
        icon: "",
      },
      {
        title: "Govern Collectively",
        description:
          "Engage & influence the network as a collaborative ecosystem.",
        icon: "",
      },
    ],
    []
  );

  const [pagination] = usePagination({ pageIndex: 0, pageSize: 10 });
  // const [sorting, setSorting] = useSorting({
  //   id: "index",
  //   desc: true,
  // });

  const handleShowAllProposals = () => {
    navigate("/proposals");
  };
  const handleShowAllNeurons = () => {
    navigate("/governance/neurons");
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="pr-0 xl:pr-16 pb-8 xl:pb-0 text-center xl:text-left">
          <h1 className="text-4xl sm:text-6xl font-bold">
            Governance Overview
          </h1>
          <h2 className="mt-2 text-xl text-content/60">
            Welcome to ORIGYN Governance!
          </h2>
          <p className="mt-6  text-content/60">
            Holders of OGY tokens can directly influence the ORIGYN Network by
            staking their OGY and voting on proposals. By participating in the
            decision-making process, these staked token holders earn rewards.
          </p>
          <Button className="mt-8">Learn more</Button>
        </div>
        <EstimateRewards />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 mt-16 gap-8">
        {governanceFeatures.map(({ title, description, icon }) => (
          <Card key={title}>
            <div className="flex">
              <div className="shrink-0 w-16 h-16 flex items-center justify-center bg-surface-2 rounded-xl">
                {icon}
              </div>
              <div className="ml-8">
                <div className="font-semibold">{title}</div>
                <div className="text-content/60">{description}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex flex-col xl:flex-row justify-between items-center xl:items-end mt-32 mb-12">
        <div className="text-center xl:text-left">
          <h2 className="text-3xl font-bold">Tokens in Governance</h2>
          <p className="mt-2">
            Holders of OGY tokens can directly influence the ORIGYN Network by
            staking their OGY and voting on proposals. By participating in the
            decision-making process, these staked token holders earn rewards and
            govern collectively and democratically. Learn more about OGY
          </p>
        </div>
        <div className="mt-8 xl:mt-0 pl-0 xl:pl-16 shrink-0">
          <Button>More details</Button>
        </div>
      </div>
      <TokensInGovernanceTotal
        className="mb-16"
        tokensInGovernance={data.dataTokensInGovernanceTotal.tokensInGovernance}
        tokensInGovernanceTotal={
          data.dataTokensInGovernanceTotal.tokensInGovernanceTotal
        }
        colors={data.dataTokensInGovernanceTotal.colors}
      />

      <Suspense fallback={<p>Loading dataTokensInGovernanceKpi...</p>}>
        <Await
          resolve={data.dataTokensInGovernanceKpi}
          errorElement={<p>Error loading dataTokensInGovernanceKpi!</p>}
        >
          {(dataTokensInGovernanceKpi) => (
            <TokensInGovernanceKpi
              className="mb-16"
              data={dataTokensInGovernanceKpi}
            />
          )}
        </Await>
      </Suspense>
      <div className="mb-16">
        <div className="flex items-center mb-8 gap-8">
          <h2 className="text-3xl font-bold">Proposals</h2>
          <Button onClick={handleShowAllProposals}>Show all</Button>
        </div>
        <ProposalsList pagination={pagination} />
      </div>
      <div>
        <div className="flex items-center mb-8 gap-8">
          <h2 className="text-3xl font-bold">Neurons</h2>
          <Button onClick={handleShowAllNeurons}>Show all</Button>
        </div>

        <NeuronsList pagination={pagination} />
      </div>
    </div>
  );
};

Governance.loader = loader;
