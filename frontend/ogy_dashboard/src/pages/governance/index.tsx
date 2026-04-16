import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
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
import { PieChartProvider } from "@components/charts/pie/context";
import ChartTotalTokensStakes from "./ChartTotalTokensStakes";
import ChartVotingParticipation from "./ChartVotingParticipation";

export const Governance = () => {
  const location = useLocation();
  const scrollTarget = (location.state as { scrollTo?: string })?.scrollTo;

  const scrollRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || !scrollTarget || node.id !== scrollTarget) return;
      setTimeout(() => {
        node.scrollIntoView({ behavior: "smooth" });
      }, 500);
      window.history.replaceState({}, "");
    },
    [scrollTarget]
  );

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

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-0 2xl:gap-8">
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
        <TokensInGovernanceTotal className="mb-16" />
      </PieChartProvider>

      <TokensInGovernanceKpi className="mb-16" />

      <div className="mb-16">
        <ChartTotalTokensStakes />
      </div>
      <div className="mb-16">
        <ChartVotingParticipation />
      </div>

      <div id="governance-proposals" ref={scrollRef} className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Proposals</h2>
        <ProposalsList />
      </div>
      <div id="governance-neurons" ref={scrollRef}>
        <h2 className="text-3xl font-bold mb-8">Neurons</h2>
        <NeuronsList />
      </div>
    </div>
  );
};
