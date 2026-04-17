import { Card, TooltipInfo, Button, SkeletonOverlay } from "@components/ui";
import { StatCard } from "@components/dashboard";
import useFetchOGYRewardAccount from "@hooks/accounts/useFetchOGYRewardAccount";
import { RewardPool } from "@hooks/accounts/useFetchOGYRewardAccount";
import { FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";

const FAKE_ORA_ROWS: RewardPool[] = Array.from({ length: 6 }, (_, i) => ({
  year: `${2024 + i * 2}`,
  reward_pool: "0 OGY",
}));

const ORATable = ({ rows }: { rows: RewardPool[] }) => (
  <div className="border border-border rounded-[25px] overflow-hidden overflow-x-auto h-full">
    <table className="min-w-full h-full border-separate border-spacing-0">
      <tbody>
        <tr className="bg-charcoal text-white">
          <td className="py-5 xl:py-3 pl-[70px] xl:pl-[35px] pr-4 font-semibold text-left whitespace-nowrap">
            <strong className="font-semibold">Year</strong>
          </td>
          {rows.map((item, i) => (
            <td
              key={item.year ?? i}
              className="py-5 xl:py-3 px-4 text-left text-border-strong whitespace-nowrap"
            >
              <span>{item.year}</span>
            </td>
          ))}
        </tr>
        <tr className="bg-white">
          <td className="py-3 pl-[35px] pr-4 font-semibold text-left text-content whitespace-nowrap">
            <strong className="font-semibold">Reward Pool</strong>
          </td>
          {rows.map((item, i) => (
            <td
              key={item.year ?? i}
              className="py-5 xl:py-3 px-4 text-left text-muted whitespace-nowrap"
            >
              <span>{item.reward_pool}</span>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </div>
);

const OrigynTreasuryAccount = ({
  className,
}: {
  className?: string;
}) => {
  const { data, isLoading, isError } = useFetchOGYRewardAccount();

  const rows = isLoading || !data ? FAKE_ORA_ROWS : data.rewardsPool.rows;
  const balance = isLoading || !data ? FAKE_STAT_VALUE : data.rewardAccountBalance;

  return (
    <Card className={className}>
      <div className="text-charcoal text-[22px] font-semibold leading-none">
        ORIGYN Reward Account (ORA)
      </div>
      {!isError && (
        <SkeletonOverlay loading={isLoading}>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8 items-stretch">
            <StatCard
              className="xl:col-span-1"
              title="ORA Balance"
              value={balance}
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
                    <Button className="mt-2 mx-auto w-full">More details</Button>
                  </a>
                </TooltipInfo>
              }
              underlineClassName="bg-content"
            />
            <div className="xl:col-span-3">
              <ORATable rows={rows} />
            </div>
          </div>
        </SkeletonOverlay>
      )}
      <p className="mt-6 font-light text-[13px] leading-none text-muted">
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
