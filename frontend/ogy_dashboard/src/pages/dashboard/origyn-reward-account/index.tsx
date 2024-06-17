/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Card, LoaderSpin, TooltipInfo, Button } from "@components/ui";
import useFetchOGYRewardAccount from "@hooks/accounts/useFetchOGYRewardAccount";
import { Table } from "@components/ui";

const OrigynTreasuryAccount = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const { data, isLoading, isError, isSuccess } = useFetchOGYRewardAccount();

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="text-lg font-semibold">ORIGYN Reward Account (ORA)</div>
      {isSuccess && (
        <div className="grid grid-cols-1 gap-8 mt-8 pb-4">
          <Card className="bg-surface-2/40 dark:bg-surface-2 h-36">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-lg font-semibold">
                <img src="/ogy_logo.svg" alt="OGY Logo" />
                <span className="ml-2 text-content/60">ORA Balance (OGY)</span>
              </div>
              <TooltipInfo id="tooltip-ora-ogy" clickable={true}>
                <p>
                  Token holders are able to stake their OGY and gain rewards by
                  participating in governance.
                </p>
                <p>
                  Rewards will come from the ORIGYN Reward Account, which ORIGYN
                  will seed with one billion OGY.
                </p>
                <p>
                  The reward pool consists of 250 million OGY in its first year
                  and will halve every two years to incentivize and reward early
                  and long-term contributors of the ecosystem.
                </p>
                <a
                  href="https://origyn.gitbook.io/origyn/tokenomics/staking-and-rewards"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="my-4 mx-auto w-full">More details</Button>
                </a>
              </TooltipInfo>
            </div>
            <div className="flex items-center mt-4 text-2xl font-semibold">
              <span className="mr-3">{data.rewardAccountBalance}</span>
              <span className="text-content/60">OGY</span>
            </div>
            <Card.BorderBottom className="bg-content" />
          </Card>
          <div className="">
            <Table columns={data.rewardsPoolColumns} data={data.rewardsPool} />
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin />
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center h-36 text-red-500 font-semibold">
          <div>Network error: Unable to fetch OGY reward account data</div>
        </div>
      )}
    </Card>
  );
};

export default OrigynTreasuryAccount;
