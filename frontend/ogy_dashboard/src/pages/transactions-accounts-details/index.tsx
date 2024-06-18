import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import useFecthOneAccount from "@hooks/accounts/useFetchOneAccount";
// import { Principal } from "@dfinity/principal";
// import { AccountIdentifier } from "@dfinity/ledger-icp";
import Skeleton from "react-loading-skeleton";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { usePagination, useSorting } from "@helpers/table/useTable";
import TransactionsAccountList from "@pages/transactions/transactions-account-list";
import BalanceHistory from "./ChartBalanceHistory";
import TransactionsChart from "./transactions-chart/TransactionsChart";
import { Button } from "@components/ui";

const TransactionsAccountsDetails = () => {
  const navigate = useNavigate();
  const handleOnClickBack = () => {
    navigate(-1);
  };
  const [pagination] = usePagination({});
  const [sorting] = useSorting({
    id: "index",
    desc: true,
  });

  const params = useParams();

  const { data, isError, isLoading, isSuccess } = useFecthOneAccount({
    accountId: params.accountId as string,
  });

  const handleShowAllTxHistory = () => {
    navigate(
      `/explorer/transactions/accounts/${params.accountId as string}/history`
    );
  };

  return (
    <>
      <div className="container mx-auto pt-8 pb-16 px-4">
        <div className="div div-col xl:div-row items-center justify-between py-8">
          <div className="div div-col xl:div-row xl:justify-center items-center gap-4 xl:gap-8">
            <ArrowLeftIcon
              className="h-8 w-8 hover:cursor-pointer"
              onClick={handleOnClickBack}
            />
            <div className="div div-col items-center xl:items-start">
              <div className="text-sm">Explorer</div>
              <div className="text-3xl font-bold mb-4 xl:mb-0">OGY account</div>
            </div>
          </div>
        </div>
        <div className="grid xl:grid-cols-3 mt-8 bg-surface rounded-xl border border-border">
          <div className="div div-col text-center xl:text-start xl:col-span-2 rounded-t-xl xl:rounded-tr-none xl:rounded-s-lg p-6 bg-surface">
            <div className="mb-4">
              <div className="text-content/60">ID</div>
              <div className="font-bold break-all">{data?.id}</div>
            </div>
            <div className="mb-4">
              <div className="text-content/60">Owner</div>
              <div className="font-bold break-all">{data?.owner}</div>
            </div>
            <div className="mb-4">
              <div className="text-content/60">Subaccount</div>
              <div className="font-bold break-all">
                {data?.formatted.subaccount}
                {/* {data?.has_subaccount ||
                  (data?.id &&
                    AccountIdentifier.fromPrincipal({
                      principal: Principal.fromText(data?.id || ""),
                    }).toHex())} */}
              </div>
            </div>
          </div>
          <div className="grid grid-flow-row xl:border-l border-border">
            <div className="xl:col-span-1 rounded-tr-none xl:rounded-tr-lg p-6 bg-surface div items-center justify-center border-t border-border xl:border-none">
              <div className="div div-col items-center">
                <div className="font-semibold mb-4">Balance</div>
                <div className="mt-4 flex items-center text-2xl font-semibold">
                  {isSuccess && (
                    <>
                      <img src="/ogy_logo.svg" alt="OGY Logo" />
                      <span className="ml-2 mr-3">
                        {roundAndFormatLocale({
                          number: divideBy1e8(data?.balance || 0),
                        })}
                      </span>
                      <span className="text-content/60">OGY</span>
                    </>
                  )}
                  {(isLoading || isError) && <Skeleton className="w-64" />}
                </div>
              </div>
            </div>
            {/* <div className="xl:col-span-1 rounded-b-lg xl:rounded-bl-none xl:rounded-br-lg border-t border-border p-6 bg-surface-2">
              <div className="div div-col items-center">
                <div className="mb-1">
                  <span className="text-sm text-content/60">Historical max balance</span>
                  <div className="mt-2 flex items-center text-md font-semibold">
                    {isSuccess && (
                      <>
                        <img src="/ogy_logo.svg" style={{ width: 20 }} alt="OGY Logo" />
                        <span className="ml-2 mr-3">{
                          roundAndFormatLocale({
                            number: divideBy1e8(data?.balance),
                          })}</span>
                        <span className="text-content/60">OGY</span>
                      </>
                    )}
                    {(isLoading || isError) && <Skeleton className="w-64" />}
                  </div>
                </div>
              </div>

            </div> */}
          </div>
        </div>
        <TransactionsChart id={params.accountId || ""} />
        <BalanceHistory className="mt-16" account={params?.accountId || ""} />
        <div>
          <div className="flex items-center mt-16 mb-8 gap-8">
            <h2 className="text-3xl font-bold">Transactions history</h2>
            <Button onClick={handleShowAllTxHistory}>Show all</Button>
          </div>
          <TransactionsAccountList
            accountId={params?.accountId}
            pagination={pagination}
            sorting={sorting}
          />
        </div>
      </div>
    </>
  );
};

export default TransactionsAccountsDetails;
