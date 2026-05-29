import { Card, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import TokenDistributionList from "@pages/token-distribution/token-distribution-list";
import { usePagination } from "@helpers/table/useTable";
import useTokenDistribution from "@hooks/metrics/useTokenDistribution";
import { useT } from "@i18n/LocaleContext";

const TokenDistribution = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const t = useT();
  const [pagination, setPagination] = usePagination({
    pageIndex: 0,
    pageSize: 10,
  });

  const { isFetching, isError } = useTokenDistribution({
    limit: pagination.pageSize,
    offset: pagination.pageSize * pagination.pageIndex,
  });

  const hasError = !isFetching && isError;
  const showSkeleton = isFetching || hasError;

  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={`${className}`} {...restProps}>
        {hasError && (
          <CardErrorOverlay title={t("dashboard.tokenDistribution.title")} />
        )}
        <div data-skel-static className="mb-8">
          <div className="text-content text-[22px] font-semibold leading-none">
            {t("dashboard.tokenDistribution.title")}
          </div>
        </div>
        <TokenDistributionList
          pagination={pagination}
          setPagination={setPagination}
        />
      </Card>
    </SkeletonOverlay>
  );
};

export default TokenDistribution;
