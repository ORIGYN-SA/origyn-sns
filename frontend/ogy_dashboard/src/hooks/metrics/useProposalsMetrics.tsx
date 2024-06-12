import { useState, useEffect, ReactNode } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import fetchProposalsMetrics from "@services/queries/metrics/fetchProposalsMetrics";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";

const useProposalsMetrics = () => {
  const [tokenMetricsActor] = useCanister("tokenMetrics");
  const [data, setData] = useState<
    | {
        name: string;
        value: string;
        tooltip: ReactNode;
      }[]
    | []
  >([]);
  const proposalsMetrics = useQuery({
    queryKey: ["proposalsMetrics"],
    queryFn: () =>
      fetchProposalsMetrics({
        actor: tokenMetricsActor,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (proposalsMetrics.isSuccess) {
      const {
        average_voting_participation,
        average_voting_power,
        daily_voting_rewards,
        reward_base_current_year,
        total_proposals,
        total_voting_power,
      } = proposalsMetrics.data;

      console.log(proposalsMetrics.data);

      setData([
        {
          name: "Proposals",
          value: Number(total_proposals).toString(),
          tooltip: (
            <>
              <p>
                The non-binding proposal to adopt certain change inside the
                governance system, made by the ORIGYN Foundation.
              </p>
              <p>
                Anyone who staked their tokens can vote to approve or reject
                given proposal.
              </p>
            </>
          ),
        },
        {
          name: "Reward Base for the current year",
          value: roundAndFormatLocale({
            number: divideBy1e8(reward_base_current_year),
          }),
          tooltip: (
            <>
              <p>
                In the first year (Sept 23-Sept 24) 250M are distributed among
                all the stake holders.
              </p>
              <p>Depending how many people are staking the ration vary.</p>
              <p>It will halfling every second year.</p>
              <p className="my-2">
                <a
                  href="https://origyn.gitbook.io/origyn/tokenomics/tokenomics-3.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-content font-semibold"
                >
                  Please read token economy v3
                </a>
              </p>
            </>
          ),
        },
        {
          name: "Daily Voting Rewards",
          value: roundAndFormatLocale({
            number: divideBy1e8(daily_voting_rewards),
          }),
          tooltip: (
            <>
              <p>
                Rewards allocated during last rewards allocation for all stake
                holders.
              </p>
            </>
          ),
        },
        {
          name: "Average Voting Power",
          value: roundAndFormatLocale({
            number: divideBy1e8(average_voting_power),
          }),
          tooltip: (
            <>
              <p>Average Voting power between all the proposals.</p>
              <p>
                Its calculated by summing all the voting power (number of tokens
                staked in governance) for all proposals and dividing by their
                amount.
              </p>
            </>
          ),
        },
        {
          name: "Total Voting Power",
          value: roundAndFormatLocale({
            number: divideBy1e8(total_voting_power),
          }),
          tooltip: (
            <>
              <p>
                Accumulated voting power of all existing stakes in governance.
              </p>
            </>
          ),
        },
        {
          name: "Overall Voting Participation",
          value: roundAndFormatLocale({
            number: divideBy1e8(average_voting_participation),
          }),
          tooltip: (
            <>
              <p>
                The percentage of voting power involved in proposal voting. Its
                active participation compared to total voting power.
              </p>
            </>
          ),
        },
      ]);
    }
  }, [proposalsMetrics.isSuccess, proposalsMetrics.data]);

  return {
    data: data,
    isLoading: proposalsMetrics.isLoading,
    isSuccess: proposalsMetrics.isSuccess,
    isError: proposalsMetrics.isError,
    error: proposalsMetrics.error,
  };
};

export default useProposalsMetrics;
