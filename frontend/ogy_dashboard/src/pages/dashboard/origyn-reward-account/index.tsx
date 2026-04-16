import { Card, TooltipInfo, Button } from "@components/ui";
import { StatCard } from "@components/dashboard";
import { TableSkeleton } from "@components/ui/NewTable";
import useFetchOGYRewardAccount from "@hooks/accounts/useFetchOGYRewardAccount";
import { RewardPool } from "@hooks/accounts/useFetchOGYRewardAccount";

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
              className="py-5 xl:py-3 px-4 text-left text-[#E1E1E1] whitespace-nowrap"
            >
              <span>{item.year}</span>
            </td>
          ))}
        </tr>
        <tr className="bg-white">
          <td className="py-3 pl-[35px] pr-4 font-semibold text-left text-[#222526] whitespace-nowrap">
            <strong className="font-semibold">Reward Pool</strong>
          </td>
          {rows.map((item, i) => (
            <td
              key={item.year ?? i}
              className="py-5 xl:py-3 px-4 text-left text-[#69737C] whitespace-nowrap"
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

  const rows = isLoading ? FAKE_ORA_ROWS : data.rewardsPool.rows;

  return (
    <Card className={className}>
      <div className="text-charcoal text-[22px] font-semibold leading-none">
        ORIGYN Reward Account (ORA)
      </div>
      {!isError && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8 items-stretch">
          <StatCard
            className="xl:col-span-1"
            loading={isLoading}
            title="ORA Balance"
            value={data.rewardAccountBalance}
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
          {isLoading ? (
            <TableSkeleton className="xl:col-span-3 h-full">
              <ORATable rows={rows} />
            </TableSkeleton>
          ) : (
            <div className="xl:col-span-3">
              <ORATable rows={rows} />
            </div>
          )}
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
