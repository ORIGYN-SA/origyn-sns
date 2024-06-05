import { Skeleton } from "@components/ui";
import useAccountOverview from "@hooks/metrics/useAccountOverview";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";

type BalanceHistoryProps = {
  className?: string;
  account: string;
};

const BalanceHistory = ({ account }: BalanceHistoryProps) => {
  const { data, isSuccess, isLoading, error } = useAccountOverview(account);
  console.log(data, isSuccess, isLoading, error);
  return (
    <div className="mt-2 flex items-center text-md font-semibold">
      {isSuccess && data && (
        <>
          <img src="/ogy_logo.svg" style={{ width: 20 }} alt="OGY Logo" />
          <span className="ml-2 mr-3">{
            roundAndFormatLocale({
              number: divideBy1e8(data?.balance || 0),
            })}</span>
          <span className="text-content/60">OGY</span>
        </>
      )}
      {(isLoading || error) && <Skeleton className="w-64" />}
    </div>
  );
};

export default BalanceHistory;
