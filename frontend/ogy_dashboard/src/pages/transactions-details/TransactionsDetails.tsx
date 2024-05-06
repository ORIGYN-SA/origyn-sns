// import { useMemo, Suspense } from "react";
import { useLoaderData, useNavigate, useParams } from "react-router-dom";
import { useQuery, QueryClient, UseQueryResult } from "@tanstack/react-query";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Card } from "@components/ui";
import fetchOneTransactionQuery, {
  Transaction,
  FetchOneTransactionParams,
} from "@services/transactions/fetchOneTransactionQuery";

import { UserIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

const loader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: FetchOneTransactionParams }) => {
    const query = fetchOneTransactionQuery({ index: params.index });
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };

export const TransactionsDetails = () => {
  const navigate = useNavigate();
  const initialData = useLoaderData() as Awaited<
    ReturnType<ReturnType<typeof loader>>
  >;
  const params = useParams();

  const { data }: UseQueryResult<Transaction> = useQuery({
    ...fetchOneTransactionQuery({ index: params.index }),
    initialData,
  });

  const handleOnClickBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto pt-8 pb-16 px-4">
      <div className="flex flex-col xl:flex-row items-center justify-between py-8">
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
        <div>Principal ID: 8329839839283982</div>
      </div>
      <div className="grid grid-cols-6 gap-4 mt-8">
        <Card className="col-span-6 xl:col-start-2 xl:col-span-4 p-0">
          <div className="grid grid-cols-1 gap-8 p-6">
            <div className="flex justify-between items-center">
              <div>
                <span>Index: </span>
                <span className="font-semibold text-xl">{data.index}</span>
              </div>
              <div>{data.kind}</div>
            </div>
            {/* // TODO: Create a component for this instead of duplicate it */}
            <div className="flex justify-between items-center bg-surface-2 p-1 rounded-full border border-border/60">
              <div className="rounded-full w-12 h-12 bg-surface-3 flex justify-center items-center shrink-0">
                <UserIcon className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
              <div className="px-4">
                <span className="text-content/60">From: </span>
                <span className="font-semibold shrink">
                  {data.from_account}
                </span>
              </div>
              <div className="rounded-full w-12 h-12 flex justify-center items-center pr-4">
                <DocumentDuplicateIcon
                  className="h-6 w-6 text-content/80"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="flex justify-between items-center bg-surface-2 p-1 rounded-full border border-border/60">
              <div className="rounded-full w-12 h-12 bg-surface-3 flex justify-center items-center shrink-0">
                <UserIcon className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
              <div className="px-4 text-center text-ellipsis text-wrap text-clip">
                <span className="text-content/60">From: </span>
                <span className="font-semibold shrink">{data.to_account}</span>
              </div>
              <div className="rounded-full w-12 h-12 flex justify-center items-center pr-4">
                <DocumentDuplicateIcon
                  className="h-6 w-6 text-content/80"
                  aria-hidden="true"
                />
              </div>
            </div>
            {/* // TODO: Create component separation */}
            <div className="h-0.5 bg-surface-2"></div>
            <div>
              <div className="flex justify-between items-center">
                <div className="text-xl font-semibold">Amount</div>
                <div className="text-xl font-semibold">{data.amount}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-content/60 text-sm">Fee</div>
                <div className="text-content/60 text-sm">{data.fee}</div>
              </div>
            </div>
            {/* // TODO: Create component separation */}
            <div className="h-0.5 bg-surface-2"></div>
            <div>
              <div className="flex justify-between items-center">
                <div className="text-md font-semibold text-content/60">
                  Memo
                </div>
                <div className="text-md text-content/60 font-semibold">
                  {data.memo}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-2 flex justify-center py-4 rounded-b-lg border-t border-border/60">
            {data.updated_at}
          </div>
        </Card>
      </div>
    </div>
  );
};

TransactionsDetails.loader = loader;
