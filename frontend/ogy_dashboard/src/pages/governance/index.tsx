import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Button, FeatureCard } from "@components/ui";
import {
  StakeVoteIcon,
  EarnRewardsIcon,
  GovernCollectivelyIcon,
} from "@components/ui/icons";
import { useT } from "@i18n/LocaleContext";
import EstimateRewards from "@pages/governance/estimate-rewards/EstimateRewards";
import TokensInGovernanceTotal from "@pages/governance/tokens-in-governance-total/TokensInGovernanceTotal";
import TokensInGovernanceKpi from "@pages/governance/tokens-in-governance-kpi/TokensInGovernanceKPI";
import NeuronsList from "@pages/neurons/neurons-list/NeuronsList";
import ProposalsList from "@pages/proposals/proposals-list/ProposalsList";
import { PieChartProvider } from "@components/charts/pie/context";
import { StakingOverviewChart } from "@components/dashboard";
import ChartVotingParticipation from "./ChartVotingParticipation";

const HeroBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
  >
    <div
      className="absolute -bottom-[55%] -start-[10%] w-[1400px] h-[1600px]"
      style={{
        background:
          "radial-gradient(ellipse, rgba(80,190,143,0.55) 0%, transparent 60%)",
      }}
    />
    <div
      className="absolute -top-[55%] -end-[10%] w-[1500px] h-[1700px]"
      style={{
        background:
          "radial-gradient(ellipse, rgba(255,205,90,0.4) 0%, transparent 60%)",
      }}
    />
    <div className="absolute inset-0 bg-background/80 backdrop-blur-[75px]" />
    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
  </div>
);

export const Governance = () => {
  const t = useT();
  const location = useLocation();
  const scrollTarget = (location.state as { scrollTo?: string })?.scrollTo;

  const scrollRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || !scrollTarget || node.id !== scrollTarget) return;
      setTimeout(() => {
        node.scrollIntoView();
      }, 500);
      window.history.replaceState({}, "");
    },
    [scrollTarget]
  );

  const governanceFeatures = useMemo(
    () => [
      {
        title: t("governance.features.stakeVote.title"),
        description: t("governance.features.stakeVote.description"),
        icon: <StakeVoteIcon />,
      },
      {
        title: t("governance.features.earnRewards.title"),
        description: t("governance.features.earnRewards.description"),
        icon: <EarnRewardsIcon />,
      },
      {
        title: t("governance.features.governCollectively.title"),
        description: t("governance.features.governCollectively.description"),
        icon: <GovernCollectivelyIcon />,
      },
    ],
    [t]
  );

  return (
    <div className="max-w-[1440px] mx-auto">
      <section className="relative isolate overflow-hidden">
        <HeroBackground />

        <div className="max-w-[1125px] mx-auto px-4 py-8 sm:py-16 flex flex-col gap-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 items-start gap-8 xl:gap-0 2xl:gap-8">
            <div className="pe-0 xl:pe-16 pb-8 xl:pb-0 text-center xl:text-start flex flex-col items-center xl:items-start gap-[17px]">
              <h1 className="text-[28px] sm:text-[40px] font-bold leading-tight sm:leading-none text-content">
                {t("governance.overview.title")}
              </h1>
              <h2 className="text-[18px] sm:text-[22px] font-light leading-snug sm:leading-none text-muted">
                {t("governance.overview.welcome")}
              </h2>
              <p className="text-base font-light leading-6 text-muted">
                {t("governance.overview.description")}
              </p>
              <a
                href="https://origyn.gitbook.io/origyn/tokenomics/staking-and-rewards"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="!px-[25px] !py-0 text-[14px] leading-[48px]">
                  <div className="flex items-center justify-center">
                    <div>{t("governance.overview.learnMore")}</div>
                    <div>
                      <ArrowTopRightOnSquareIcon className="ms-2 h-5 w-5 text-background" />
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
        <div className="flex flex-col xl:flex-row items-center justify-between gap-8 mt-16 mb-12">
          <div className="text-center xl:text-start">
            <h2 className="text-[28px] font-bold leading-none text-content">
              {t("governance.tokensSection.title")}
            </h2>
            <p className="mt-4 text-base font-normal leading-6 text-muted">
              {t("governance.tokensSection.paragraph1")}
            </p>
            <p className="mb-2 text-base font-normal leading-6 text-muted">
              {t("governance.tokensSection.paragraph2")}
            </p>
          </div>
          <a
            href="https://origyn.gitbook.io/origyn/tokenomics/tokenomics-3.0"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button className="!px-[25px] !py-0 text-[14px] leading-[48px]">
              {t("governance.tokensSection.learnMoreOgy")}
            </Button>
          </a>
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
          <h2 className="text-3xl font-bold mb-8">
            {t("governance.sections.proposals")}
          </h2>
          <ProposalsList />
        </div>
        <div id="governance-neurons" ref={scrollRef}>
          <h2 className="text-3xl font-bold mb-8">
            {t("governance.sections.neurons")}
          </h2>
          <NeuronsList />
        </div>
      </div>
    </div>
  );
};
