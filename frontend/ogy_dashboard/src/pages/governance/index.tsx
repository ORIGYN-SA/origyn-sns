import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Button, FeatureCard } from "@components/ui";
import {
  StakeVoteIcon,
  EarnRewardsIcon,
  GovernCollectivelyIcon,
} from "@components/ui/icons";
import EstimateRewards from "@pages/governance/estimate-rewards/EstimateRewards";
import TokensInGovernanceTotal from "@pages/governance/tokens-in-governance-total/TokensInGovernanceTotal";
import TokensInGovernanceKpi from "@pages/governance/tokens-in-governance-kpi/TokensInGovernanceKPI";
import NeuronsList from "@pages/neurons/neurons-list/NeuronsList";
import ProposalsList from "@pages/proposals/proposals-list/ProposalsList";
import { PieChartProvider } from "@components/charts/pie/context";
import { StakingOverviewChart } from "@components/dashboard";
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
        icon: <StakeVoteIcon />,
      },
      {
        title: "Earn Rewards",
        description:
          "Participate in the decision-making process to earn rewards.",
        icon: <EarnRewardsIcon />,
      },
      {
        title: "Govern Collectively",
        description:
          "Engage & influence the network as a collaborative ecosystem.",
        icon: <GovernCollectivelyIcon />,
      },
    ],
    []
  );

  return (
    <div className="max-w-[1440px] mx-auto">
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div
            className="absolute -bottom-[55%] -left-[10%] w-[1400px] h-[1600px]"
            style={{
              background:
                "radial-gradient(ellipse, rgba(80,190,143,0.55) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute -top-[55%] -right-[10%] w-[1500px] h-[1700px]"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,205,90,0.4) 0%, transparent 60%)",
            }}
          />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[75px]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="max-w-[1125px] mx-auto px-4 py-16 flex flex-col gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-0 2xl:gap-8">
            <div className="pr-0 xl:pr-16 pb-8 xl:pb-0 text-center xl:text-left flex flex-col items-center xl:items-start gap-[17px]">
              <h1 className="text-[40px] font-bold leading-none text-content">
                Governance Overview
              </h1>
              <h2 className="text-[22px] font-light leading-none text-muted">
                Welcome to ORIGYN Governance!
              </h2>
              <p className="text-base font-light leading-6 text-muted">
                Holders of OGY tokens can directly influence the ORIGYN Network
                by staking their OGY and voting on proposals. By participating
                in the decision-making process, these staked token holders earn
                rewards.
              </p>
              <a
                href="https://origyn.gitbook.io/origyn/tokenomics/staking-and-rewards"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="!px-[25px] !py-0 text-[14px] leading-[48px]">
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {governanceFeatures.map(({ title, description, icon }) => (
              <FeatureCard
                key={title}
                title={title}
                description={description}
                icon={icon}
                variant="glass"
              />
            ))}
          </div>
        </div>
      </section>

      <div className="px-4 pb-16">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-start mt-16 mb-12">
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
        <StakingOverviewChart />
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
    </div>
  );
};
