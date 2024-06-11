import { useMemo } from "react";
import { Card, TooltipInfo } from "@components/ui";

export interface TokensInGovernanceKPIProps {
  className?: string;
  data: Data[];
}

interface Data {
  name: string;
  value: number;
}

const TokensInGovernanceKPI = ({ className }: TokensInGovernanceKPIProps) => {
  const data = useMemo(
    () => [
      {
        name: "Proposals",
        value: "20192",
        tooltip: (
          <>
            <p>
              The non-binding proposal to adopt certain change inside the
              governance system, made by the ORIGYN Foundation.
            </p>
            <p>
              Anyone who staked their tokens can vote to approve or reject given
              proposal.
            </p>
          </>
        ),
      },
      {
        name: "Reward Base for the current year",
        value: "250,000,000",
        tooltip: (
          <>
            <p>
              In the first year (Sept 23-Sept 24) 250M are distributed among all
              the stake holders.
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
        value: "684,289",
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
        value: "794'992'323",
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
        value: "1'232'238'366",
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
        value: "1'232'238'366",
        tooltip: (
          <>
            <p>
              The percentage of voting power involved in proposal voting. Its
              active participation compared to total voting power.
            </p>
          </>
        ),
      },
    ],
    []
  );

  const colorsClassName = useMemo(
    () => [
      "bg-purple-400",
      "bg-blue-400",
      "bg-yellow-400",
      "bg-gray-400",
      "bg-pink-400",
      "bg-red-400",
    ],
    []
  );
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 ${className}`}
    >
      {data.map(({ name, value, tooltip }, index) => (
        <Card className="bg-surface pb-8" key={name}>
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-content/60 mr-2">
              {name}
            </h2>
            <TooltipInfo id={name} clickable={true}>
              {tooltip}
            </TooltipInfo>
          </div>

          <div className="flex items-center mt-2 text-2xl font-semibold">
            {value}
          </div>
          <Card.BorderBottom className={colorsClassName[index]} />
        </Card>
      ))}
    </div>
  );
};

export default TokensInGovernanceKPI;
