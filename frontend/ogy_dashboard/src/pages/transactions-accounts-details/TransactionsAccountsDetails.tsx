import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Tooltip } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import useFecthOneAccount from "@hooks/accounts/useFetchOneAccount";

export const TransactionsAccountsDetails = () => {
  const navigate = useNavigate();
  const params = useParams();

  const handleOnClickBack = () => navigate(-1);

  const { data } = useFecthOneAccount({ accountId: params.id as string });

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
      <div className="grid xl:grid-cols-3 mt-8 bg-surface rounded-xl border border-border">
        <div className="flex flex-col text-center xl:text-start xl:col-span-2 rounded-t-xl xl:rounded-tr-none xl:rounded-s-lg p-6 bg-surface">
          {[
            { title: "ID", value: data.id },
            { title: "Owner", value: data.owner },
            { title: "Subaccount", value: data.formatted.subaccount },
          ].map(({ title, value }) => (
            <div key={title} className="mb-4">
              <div className="text-content/60">{title}</div>

              <div className="flex items-center truncate max-w-2xl">
                {title !== "Subaccount" ||
                (title === "Subaccount" && data.has_subaccount) ? (
                  <>
                    <div
                      className="truncate font-semibold"
                      data-tooltip-id="tooltip"
                      data-tooltip-content={value}
                    >
                      {value}
                    </div>
                    <CopyToClipboard value={value as string} />
                  </>
                ) : (
                  <div className="font-semibold">{value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-flow-row xl:border-l border-border">
          <div className="xl:col-span-1 rounded-tr-none xl:rounded-tr-lg p-6 bg-surface flex items-center justify-center border-t border-border xl:border-none">
            <div className="flex flex-col items-center">
              <div className="font-semibold mb-4">Balance</div>
              <div className="flex items-center font-semibold">
                <img src="/ogy_logo.svg" alt="OGY Logo" />
                <div className="flex items-end">
                  <span className="ml-4 mr-2 text-4xl">
                    {data.formatted.balance}
                  </span>
                  <span className="text-content/60">OGY</span>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-1 rounded-b-lg xl:rounded-bl-none xl:rounded-br-lg border-t border-border p-6 bg-surface-2">
            {/* <div className="flex flex-col items-center">
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
            </div> */}
          </div>
        </div>
      </div>
      <Tooltip id="tooltip" />
    </div>
  );
};
