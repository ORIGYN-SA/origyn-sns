import { Card, TooltipInfo, Button, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay, StatCard } from "@components/dashboard";
import useFetchOGYRewardAccount from "@hooks/accounts/useFetchOGYRewardAccount";
import { RewardPool } from "@hooks/accounts/useFetchOGYRewardAccount";
import { useT } from "@i18n/LocaleContext";

const FAKE_ORA_ROWS: RewardPool[] = Array.from({ length: 6 }, (_, i) => ({
  year: `${2024 + i * 2}`,
  reward_pool: "0 OGY",
}));

const ORATable = ({ rows }: { rows: RewardPool[] }) => {
  const t = useT();
  return (
  <div className="border border-border rounded-[25px] overflow-hidden overflow-x-auto h-full">
    <table className="min-w-full h-full border-separate border-spacing-0">
      <tbody>
        <tr className="bg-charcoal text-white">
          <td
            data-skel-static
            className="py-5 xl:py-3 ps-[70px] xl:ps-[35px] pe-4 font-semibold text-start whitespace-nowrap"
          >
            <strong className="font-semibold">{t("dashboard.rewardAccount.year")}</strong>
          </td>
          {rows.map((item, i) => (
            <td
              key={item.year ?? i}
              className="py-5 xl:py-3 px-4 text-start text-white/80 whitespace-nowrap"
            >
              <span>{item.year}</span>
            </td>
          ))}
        </tr>
        <tr className="bg-surface-1">
          <td
            data-skel-static
            className="py-3 ps-[35px] pe-4 font-semibold text-start text-content whitespace-nowrap"
          >
            <strong className="font-semibold">{t("dashboard.rewardAccount.rewardPool")}</strong>
          </td>
          {rows.map((item, i) => (
            <td
              key={item.year ?? i}
              className="py-5 xl:py-3 px-4 text-start text-muted whitespace-nowrap"
            >
              <span>{item.reward_pool}</span>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </div>
  );
};

const OrigynTreasuryAccount = ({ className }: { className?: string }) => {
  const t = useT();
  const { data, isLoading, isError } = useFetchOGYRewardAccount();

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;
  const rows = showSkeleton || !data ? FAKE_ORA_ROWS : data.rewardsPool.rows;

  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={className}>
        {hasError && (
          <CardErrorOverlay title={t("dashboard.rewardAccount.title")} />
        )}
        <div
          data-skel-static
          className="text-content text-[22px] font-semibold leading-none"
        >
          {t("dashboard.rewardAccount.title")}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8 items-stretch">
          <StatCard
            className="xl:col-span-1"
            title={t("dashboard.rewardAccount.balance")}
            value={data?.rewardAccountBalance}
            unit="OGY"
            loading={showSkeleton}
            tooltip={
              <TooltipInfo id="tooltip-ora-ogy" clickable={true}>
                <p>{t("dashboard.rewardAccount.tooltipStake")}</p>
                <p>{t("dashboard.rewardAccount.tooltipSeed")}</p>
                <p>{t("dashboard.rewardAccount.tooltipPool")}</p>
                <a
                  href="https://origyn.gitbook.io/origyn/tokenomics/staking-and-rewards"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="mt-2 mx-auto w-full">
                    {t("dashboard.rewardAccount.moreDetails")}
                  </Button>
                </a>
              </TooltipInfo>
            }
            underlineClassName="bg-content"
          />
          <div className="xl:col-span-3">
            <ORATable rows={rows} />
          </div>
        </div>
        <p className="mt-6 font-light text-[13px] leading-none text-muted">
          {t("dashboard.rewardAccount.description")}
        </p>
      </Card>
    </SkeletonOverlay>
  );
};

export default OrigynTreasuryAccount;
