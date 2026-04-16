/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Card, TooltipInfo, Button } from "@components/ui";
import { StatCard } from "@components/dashboard";
import useFetchOGYRewardAccount from "@hooks/accounts/useFetchOGYRewardAccount";

const OrigynTreasuryAccount = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const { data, isLoading, isError } = useFetchOGYRewardAccount();

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="text-charcoal text-[22px] font-semibold leading-none">
        ORIGYN Reward Account (ORA)
      </div>
      {!isError && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8 items-stretch">
          <StatCard
            className="xl:col-span-1"
            loading={isLoading}
            title="ORA Balance"
            value={data?.rewardAccountBalance}
            unit="OGY"
            tooltip={
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
            }
            underlineClassName="bg-content"
          />
          <div className="xl:col-span-3 border border-border rounded-[25px] overflow-hidden overflow-x-auto h-full">
            <table className="w-full h-full border-separate border-spacing-0">
              <tbody>
                <tr className="bg-charcoal text-white">
                  <td className="py-3 pl-[35px] pr-4 font-semibold text-left whitespace-nowrap">
                    Year
                  </td>
                  {isLoading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <td key={i} className="py-3 px-4">
                          <div className="h-4 w-20 rounded bg-white/20 animate-pulse" />
                        </td>
                      ))
                    : data?.rewardsPool.rows.map((item) => (
                        <td
                          key={item.year}
                          className="py-3 px-4 text-left text-[#E1E1E1] whitespace-nowrap"
                        >
                          {item.year}
                        </td>
                      ))}
                </tr>
                <tr className="bg-white">
                  <td className="py-3 pl-[35px] pr-4 font-semibold text-left text-[#222526] whitespace-nowrap">
                    Reward Pool
                  </td>
                  {isLoading
                    ? Array.from({ length: 6 }, (_, i) => (
                        <td key={i} className="py-3 px-4">
                          <div className="h-4 w-20 rounded bg-muted/20 animate-pulse" />
                        </td>
                      ))
                    : data?.rewardsPool.rows.map((item) => (
                        <td
                          key={item.year}
                          className="py-3 px-4 text-left text-[#69737C] whitespace-nowrap"
                        >
                          {item.reward_pool}
                        </td>
                      ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="mt-6 font-light text-[13px] leading-none text-[#69737C]">
        ORIGYN will contribute one billion OGY to an ORIGYN Reward Account
        (ORA) in benefit of staked and voting holders. The reward pool consists
        of 250 million OGY in its first year and will halve every two years to
        incentivize and reward early and long-term contributors of the
        ecosystem.
      </p>
      {isError && (
        <div className="flex items-center justify-center h-36 text-red-500 font-semibold">
          <div>Network error: Unable to fetch OGY reward account data</div>
        </div>
      )}
    </Card>
  );
};

export default OrigynTreasuryAccount;
