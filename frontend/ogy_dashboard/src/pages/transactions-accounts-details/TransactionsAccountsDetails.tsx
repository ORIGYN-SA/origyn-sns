import { useQuery, QueryClient, UseQueryResult } from "@tanstack/react-query";
import {
  useLoaderData,
  // defer,
  // Await,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";

import fetchOneAccountQuery, {
  Account,
  AccountParams,
} from "@services/accounts/fetchOneAccountQuery";

// export const loader = async () => {
//   const dataProposals = new Promise((resolve) => {
//     setTimeout(() => {
//       resolve([{ name: "State", value: "Dissolving" }]);
//     }, 300);
//   });

//   return defer({
//     dataProposals: await dataProposals,
//   });
// };

// eslint-disable-next-line react-refresh/only-export-components
export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: AccountParams }) => {
    const query = fetchOneAccountQuery({ id: params.id });
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };

export const TransactionsAccountsDetails = () => {
  const navigate = useNavigate();

  const handleOnClickBack = () => {
    navigate(-1);
  };

  const initialData = useLoaderData() as Awaited<
    ReturnType<ReturnType<typeof loader>>
  >;
  const params = useParams();

  const { data }: UseQueryResult<Account> = useQuery({
    ...fetchOneAccountQuery({ id: params.id }),
    initialData,
  });

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
              OGY Account Details
            </div>
          </div>
        </div>
      </div>
      <div className="grid xl:grid-cols-3 mt-8 bg-surface rounded-lg shadow-md">
        <div className="flex flex-col text-center xl:text-start xl:col-span-2 rounded-t-xl xl:rounded-tr-none xl:rounded-s-lg p-6 bg-surface">
          {[
            { title: "ID", value: data.id },
            { title: "Owner", value: data.owner },
            { title: "Subaccount", value: data.subaccount },
          ].map(({ title, value }) => (
            <div key={title} className="mb-4">
              <div className="text-content/60">{title}</div>
              <div className="font-bold break-all">{value}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-flow-row xl:border-l border-surface-3">
          <div className="xl:col-span-1 rounded-tr-none xl:rounded-tr-lg p-6 bg-surface flex items-center justify-center border-t border-surface-3 xl:border-none">
            <div className="flex flex-col items-center">
              <div className="font-semibold mb-4">Balance</div>
              <div className="text-4xl font-semibold">{data.balance}</div>
            </div>
          </div>
          <div className="xl:col-span-1 rounded-b-lg xl:rounded-bl-none xl:rounded-br-lg border-t border-surface-3 p-6 bg-surface-2">
            <div className="flex flex-col items-center">
              {[
                { title: "Historical max balance", value: 1 },
                { title: "Genesis balance", value: 2 },
                { title: "Initial distribution balance", value: 3 },
              ].map(({ title, value }) => (
                <div key={title} className="mb-1">
                  <span className="text-sm text-content/60">{title} </span>
                  <span className="">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
