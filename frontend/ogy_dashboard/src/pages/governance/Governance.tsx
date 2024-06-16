/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useMemo } from "react";
import { useLoaderData, defer, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowTopRightOnSquareIcon,
  HandThumbUpIcon,
  CheckBadgeIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { Card, Button } from "@components/ui";
import EstimateRewards from "@pages/governance/estimate-rewards/EstimateRewards";
import TokensInGovernanceTotal from "@pages/governance/tokens-in-governance-total/TokensInGovernanceTotal";
import TokensInGovernanceKpi from "@pages/governance/tokens-in-governance-kpi/TokensInGovernanceKPI";
import NeuronsList from "@pages/neurons/neurons-list/NeuronsList";
import ProposalsList from "@pages/proposals/proposals-list/ProposalsList";
import { usePagination } from "@helpers/table/useTable";
import { PieChartProvider } from "@components/charts/pie/context";

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
  const queryClient = useQueryClient();
  const data = useLoaderData();
  const navigate = useNavigate();

  const governanceFeatures = useMemo(
    () => [
      {
        title: "Stake & Vote",
        description:
          "Influence the ORIGYN Network by staking OGY & voting on proposals.",
        icon: <HandThumbUpIcon className="h-8 w-8" />,
      },
      {
        title: "Earn Rewards",
        description:
          "Participate in the decision-making process to earn rewards.",
        icon: <CheckBadgeIcon className="h-8 w-8" />,
      },
      {
        title: "Govern Collectively",
        description:
          "Engage & influence the network as a collaborative ecosystem.",
        icon: <StarIcon className="h-8 w-8" />,
      },
    ],
    []
  );

  const [pagination] = usePagination({ pageIndex: 0, pageSize: 10 });

  const handleShowAllProposals = () => {
    navigate("/proposals");
  };
  const handleShowAllNeurons = () => {
    queryClient.invalidateQueries({ queryKey: ["listNeuronsAll"] });
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
          <p className="mt-6 text-content/60">
            Holders of OGY tokens can directly influence the ORIGYN Network by
            staking their OGY and voting on proposals. By participating in the
            decision-making process, these staked token holders earn rewards.
          </p>
          <a
            href="https://origyn.gitbook.io/origyn/tokenomics/staking-and-rewards"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="mt-8">
              <div className="flex items-center justify-center">
                <div>Learn more</div>
                <div>
                  <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 text-background" />
                </div>
              </div>
            </Button>
          </a>
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-start mt-32 mb-12">
        <div className="text-center xl:text-left">
          <h2 className="text-3xl font-bold">Tokens in Governance</h2>
          <p className="mt-4">
            Holders of OGY tokens can directly influence the ORIGYN Network by
            staking their OGY and voting on proposals.{" "}
          </p>
          <p className="mb-2">
            By participating in the decision-making process, these staked token
            holders earn rewards and govern collectively and democratically.
          </p>
          <a
            href="https://origyn.gitbook.io/origyn/tokenomics/tokenomics-3.0"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent"
          >
            Learn more about OGY
          </a>
        </div>
      </div>
      <PieChartProvider>
        <TokensInGovernanceTotal
          className="mb-16"
          tokensInGovernance={
            data.dataTokensInGovernanceTotal.tokensInGovernance
          }
          tokensInGovernanceTotal={
            data.dataTokensInGovernanceTotal.tokensInGovernanceTotal
          }
          colors={data.dataTokensInGovernanceTotal.colors}
        />
      </PieChartProvider>

      <TokensInGovernanceKpi className="mb-16" />

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
