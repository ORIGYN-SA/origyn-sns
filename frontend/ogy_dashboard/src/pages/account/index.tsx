import { UserIcon } from "@heroicons/react/20/solid";
import useConnect from "@hooks/useConnect";
import LedgerSwitch from "@pages/account/ledger-switch";
import AvailableOGY from "@pages/account/available-ogy";
import StakedOGY from "@pages/account/staked-ogy";
import StakedRewards from "@pages/account/staked-rewards";
import NeuronsList from "./neurons-list/index";
import { Tile, Tooltip } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Skeleton } from "@components/ui";

export const Account = () => {
  const { principal } = useConnect();

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-6xl font-bold mb-8">Welcome back</h1>
        <div className="bg-surface-2 rounded-full py-1 px-1 sm:w-fit mx-auto">
          <div className="flex justify-center items-center w-full">
            <Tile className="rounded-full h-8 w-8 bg-surface-3">
              <UserIcon className="p-1 text-white" />
            </Tile>

            <div className="flex items-center truncate pr-4">
              <div className="flex ml-4 items-center truncate text-sm">
                <div className="mr-2 shrink-0">Principal ID: </div>
                {principal ? (
                  <>
                    <div
                      className="truncate"
                      data-tooltip-id="tooltip_principal_id"
                      data-tooltip-content={principal}
                    >
                      {principal}
                    </div>
                    <Tooltip id="tooltip_principal_id" />
                    <CopyToClipboard value={principal as string} />
                  </>
                ) : (
                  <Skeleton className="w-64" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <LedgerSwitch className="mb-8" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <AvailableOGY />
        <StakedOGY />
        <StakedRewards />
      </div>
      <div className="mt-16">
        <NeuronsList />
      </div>
    </div>
  );
};
