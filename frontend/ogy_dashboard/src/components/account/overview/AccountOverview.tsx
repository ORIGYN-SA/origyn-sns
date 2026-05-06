import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@components/auth/useWallet";
import { Transition, TransitionChild, Dialog } from "@headlessui/react";
import { Button } from "@components/ui";
import { Stat } from "@components/dashboard";
import useFetchBalanceOGYOwner from "@hooks/accounts/useFetchBalanceOGYOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import PrincipalIdPill from "@components/account/PrincipalIdPill";

interface AccountOverviewProps {
  show: boolean;
  handleClose: () => void;
}

const AccountOverview = ({ show, handleClose }: AccountOverviewProps) => {
  const navigate = useNavigate();
  const { principalId, handleDisconnectWallet } = useWallet();

  const { data: balanceOGY } = useFetchBalanceOGYOwner();
  const {
    data: balanceOGYUSD,
    isLoading: isBalanceUsdLoading,
    isError: isBalanceUsdError,
  } = useFetchBalanceOGYUSD({ balance: balanceOGY?.balance });
  const isBalanceLoading = balanceOGY?.balance == null;
  const isUsdLoading = isBalanceLoading || isBalanceUsdLoading;

  const handleClickAccount = () => {
    navigate("account");
    handleClose();
  };

  return (
    <Transition show={show} as={Fragment}>
      <Dialog as={Fragment} static open={show} onClose={handleClose}>
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute z-50 inset-0 overflow-hidden">
            <TransitionChild
              as={Fragment}
              enter="ease-in-out duration-500"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-500"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                aria-hidden="true"
                onClick={() => handleClose()}
              />
            </TransitionChild>
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <div className="flex h-full w-[min(502px,100vw)] flex-col gap-12 overflow-y-auto bg-[linear-gradient(192.66deg,#FFFFFF_-3.07%,#F7F7F7_104.85%)] p-6 shadow-[-10px_0px_50px_0px_#0000000D] sm:p-10">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 pt-1">
                      <div className="text-[12px] font-bold uppercase tracking-[2px] text-muted">
                        Account
                      </div>
                      <h2 className="mt-4 text-[32px] font-semibold leading-none text-content">
                        Welcome back
                      </h2>
                      <p className="mt-4 max-w-[320px] text-[14px] leading-6 text-muted">
                        Manage your OGY wallet, rewards, and staking activity.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectWallet}
                      aria-label="Disconnect wallet"
                      className="shrink-0 rounded-full p-1 transition-colors hover:bg-[#E9EAF1]"
                    >
                      <svg
                        width="34"
                        height="34"
                        viewBox="0 0 34 34"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M25.456 25.4558C20.7721 30.1397 13.1693 30.1397 8.48542 25.4558C3.80155 20.772 3.80155 13.1692 8.48542 8.48528C13.1693 3.80141 20.7721 3.80141 25.456 8.48528"
                          stroke="#69737C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M28.0972 21.1892L32.3148 16.9716L28.0972 12.7539"
                          stroke="#69737C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21.7709 16.9713H32.315"
                          stroke="#69737C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="w-full text-center">
                    <div className="flex h-[61px] w-full items-center justify-center gap-2 rounded-t-[20px] border border-[#E9EAF1] bg-white px-6 py-4 font-sans text-[22px] font-normal leading-none text-[#69737C]">
                      Wallet Balance
                    </div>
                    <div className="flex min-h-[337px] w-full flex-col items-center gap-4 rounded-b-[20px] border-x border-b border-[#E9EAF1] bg-white px-5 py-8">
                      <div className="flex h-[88px] flex-col items-center justify-center">
                        <Stat
                          iconSrc="/ogy_logo.svg"
                          value={balanceOGY?.string.balance}
                          unit="OGY"
                          loading={isBalanceLoading}
                          size="hero"
                          className="justify-center"
                        />

                        <div className="mt-1 flex h-[22px] justify-center font-sans text-[22px] font-normal leading-none">
                          {!isUsdLoading ? (
                            <div className="text-content/60">
                              {isBalanceUsdError || balanceOGYUSD === undefined
                                ? "--"
                                : `($${balanceOGYUSD})`}
                            </div>
                          ) : (
                            <div
                              data-skel-block
                              className="h-[22px] w-24 rounded-md bg-muted/20 animate-pulse"
                            />
                          )}
                        </div>
                      </div>
                      <PrincipalIdPill principalId={principalId} showCopy />
                      <div className="mt-auto flex w-full flex-col gap-3">
                        <Button
                          className="h-12 w-full !py-0 text-[14px] leading-[48px]"
                          onClick={handleClickAccount}
                        >
                          My account
                        </Button>
                        <a
                          href="https://app.icpswap.com/swap"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 self-center py-1 text-[14px] font-normal text-[#69737C]"
                        >
                          How to top up?
                          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 opacity-60" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AccountOverview;
