// import { useMemo, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, UserIcon } from "@heroicons/react/20/solid";
import { Card, Tile, Tooltip, LoaderSpin } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import useFetchOneTransaction from "@hooks/transactions/useFetchOneTransaction";
import getBadgeTransactionKind from "@helpers/badge/getBadgeTransactionKind";

export const TransactionsDetails = () => {
  const navigate = useNavigate();
  const params = useParams();

  const { data, isLoading, isSuccess, isError, error } = useFetchOneTransaction(
    {
      transactionId: params.index as string,
    }
  );

  const handleOnClickBack = () => navigate(-1);

  return (
    <div className="container mx-auto pt-8 pb-16 px-4">
      <div className="flex flex-col xl:flex-row items-center py-8">
        <div className="flex flex-col xl:flex-row xl:justify-center items-center gap-4 xl:gap-8">
          <ArrowLeftIcon
            className="h-8 w-8 hover:cursor-pointer"
            onClick={handleOnClickBack}
          />
          <div className="flex flex-col items-center xl:items-start">
            <div className="text-sm">Explorer</div>
            <div className="text-3xl font-bold mb-4 xl:mb-0">
              Transaction Details
            </div>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin size="xl" />
        </div>
      )}
      {isError && (
        <div className="flex flex-col items-center">
          <div className="text-red-500 text-2xl font-semibold">
            Fetch one transaction error!
          </div>
          <div className="mt-4 p-4 mb-8 rounded-xl max-w-md overflow-auto bg-surface-2">
            {error?.message}
          </div>
        </div>
      )}
      {isSuccess && (
        <>
          <div className="flex justify-center">
            <div className="max-w-2xl gap-4 mt-8">
              <Card className="col-span-6 xl:col-start-2 xl:col-span-4 p-0">
                <div className="grid grid-cols-1 gap-8 p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <span>Index: </span>
                      <span className="font-semibold text-xl">
                        {data.index}
                      </span>
                    </div>
                    {getBadgeTransactionKind(data.kind as string)}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="mt-12 flex items-center justify-between bg-surface-2 rounded-full py-1 px-1">
                      <div className="flex items-center w-full pr-8">
                        <Tile className="rounded-full h-8 w-8 bg-surface-3">
                          <UserIcon className="p-1 text-white" />
                        </Tile>
                        <div className="flex justify-center w-full">
                          <div className="flex items-center text-center truncate pr-4">
                            <div className="flex ml-4 items-center truncate text-sm max-w-96">
                              <div className="mr-2 shrink-0">From: </div>
                              {data.kind && data.kind === "mint" && (
                                <div> Minting account</div>
                              )}
                              {data.kind && data.kind !== "mint" && (
                                <>
                                  <div
                                    className="truncate"
                                    data-tooltip-id="tooltip_principal_id"
                                    data-tooltip-content={data.from_account}
                                  >
                                    {data.from_account}
                                  </div>
                                  <Tooltip id="tooltip_principal_id" />
                                  <CopyToClipboard
                                    value={data.from_account as string}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {data.to_account && (
                      <div className="flex items-center justify-between bg-surface-2 rounded-full py-1 px-1">
                        <div className="flex items-center justify-between w-full pr-8">
                          <Tile className="rounded-full h-8 w-8 bg-surface-3">
                            <UserIcon className="p-1 text-white" />
                          </Tile>
                          <div className="flex justify-center w-full">
                            <div className="flex items-center truncate pr-4">
                              <div className="flex ml-4 items-center truncate text-sm max-w-96">
                                <div className="mr-2 shrink-0">To: </div>
                                {data.kind && data.kind === "burn" && (
                                  <div> Minting account</div>
                                )}
                                {data.kind && data.kind !== "burn" && (
                                  <>
                                    <div
                                      className="truncate"
                                      data-tooltip-id="tooltip"
                                      data-tooltip-content={data.to_account}
                                    >
                                      {data.to_account}
                                    </div>
                                    <CopyToClipboard
                                      value={data.to_account as string}
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="h-0.5 bg-surface-2"></div>
                  <div>
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-semibold">Amount</div>
                      <div className="mt-4 flex items-center text-2xl font-semibold">
                        <img src="/ogy_logo.svg" alt="OGY Logo" />
                        <div className="ml-2">{data.formatted.amount} OGY</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-content/60 text-sm">Fee</div>
                      <div className="text-content/60 text-sm">
                        {data.formatted.fee} OGY
                      </div>
                    </div>
                  </div>
                  <div className="h-0.5 bg-surface-2"></div>
                  <div>
                    <div className="flex justify-between items-center">
                      <div className="text-md font-semibold text-content/60">
                        Memo
                      </div>
                      <div
                        className="flex items-center text-md text-content/60 font-semibold truncate px-4 max-w-64"
                        data-tooltip-id="tooltip"
                        data-tooltip-content={data.formatted.memo}
                      >
                        <div className="truncate">{data.formatted.memo}</div>
                        {data.formatted.memo !== "-" && (
                          <CopyToClipboard
                            value={data.formatted.memo as string}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-2 flex justify-center py-4 rounded-b-lg border-t border-border/60">
                  {data.formatted.updated_at}
                </div>
              </Card>
            </div>
          </div>
          <Tooltip id="tooltip" />
        </>
      )}
    </div>
  );
};
