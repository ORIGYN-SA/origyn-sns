import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@components/auth/useWallet";
import { Transition, TransitionChild, Dialog } from "@headlessui/react";
import { Button } from "@components/ui";
import { CloseIcon } from "@components/ui/icons";
import { Stat } from "@components/dashboard";
import useFetchBalanceOGYOwner from "@hooks/accounts/useFetchBalanceOGYOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import PrincipalIdPill from "@components/account/PrincipalIdPill";
import AccountIdPill from "@components/account/AccountIdPill";
import { useT, useLocalePath } from "@i18n/LocaleContext";

interface AccountOverviewProps {
  show: boolean;
  handleClose: () => void;
}

const AccountOverview = ({ show, handleClose }: AccountOverviewProps) => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const { principalId, accountId, handleDisconnectWallet } = useWallet();

  const { data: balanceOGY } = useFetchBalanceOGYOwner();
  const {
    data: balanceOGYUSD,
    isLoading: isBalanceUsdLoading,
    isError: isBalanceUsdError,
  } = useFetchBalanceOGYUSD({ balance: balanceOGY?.balance });
  const isBalanceLoading = balanceOGY?.balance == null;
  const isUsdLoading = isBalanceLoading || isBalanceUsdLoading;

  const handleClickAccount = () => {
    navigate(lp("/account"));
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
                <div className="flex h-full w-[min(502px,100vw)] flex-col gap-12 overflow-y-auto bg-gradient-to-b from-surface-1 to-surface-2 p-6 shadow-[-10px_0px_50px_0px_#0000000D] sm:p-10">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label={t("common.close")}
                      className="inline-flex h-[47px] w-[47px] items-center justify-center rounded-full border border-border-faint bg-surface-muted text-content transition-colors hover:bg-surface-2 hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-content/30"
                    >
                      <CloseIcon width={18} height={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectWallet}
                      aria-label={t("account.overview.disconnectWallet")}
                      className="inline-flex h-[47px] w-[47px] items-center justify-center rounded-full border border-border-faint bg-surface-muted text-content transition-colors hover:bg-surface-2 hover:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-content/30"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 34 34"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M25.456 25.4558C20.7721 30.1397 13.1693 30.1397 8.48542 25.4558C3.80155 20.772 3.80155 13.1692 8.48542 8.48528C13.1693 3.80141 20.7721 3.80141 25.456 8.48528"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M28.0972 21.1892L32.3148 16.9716L28.0972 12.7539"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21.7709 16.9713H32.315"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0 pt-1">
                      <div className="text-[12px] font-bold uppercase tracking-[2px] text-muted">
                        {t("account.overview.accountLabel")}
                      </div>
                      <h2 className="mt-4 text-[24px] sm:text-[32px] font-semibold leading-tight sm:leading-none text-content">
                        {t("account.overview.welcomeBack")}
                      </h2>
                      <p className="mt-4 max-w-[320px] text-[14px] leading-6 text-muted">
                        {t("account.overview.manageDescription")}
                      </p>
                    </div>
                  </div>
                  <div className="w-full text-center">
                    <div className="flex h-[61px] w-full items-center justify-center gap-2 rounded-t-[20px] border border-border-faint bg-surface-1 px-6 py-4 font-sans text-[22px] font-normal leading-none text-muted">
                      {t("account.overview.walletBalance")}
                    </div>
                    <div className="flex min-h-[337px] w-full flex-col items-center gap-4 rounded-b-[20px] border-x border-b border-border-faint bg-surface-1 px-5 py-8">
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
                      <div className="flex w-full flex-col gap-2">
                        <PrincipalIdPill principalId={principalId} showCopy />
                        <AccountIdPill accountId={accountId} />
                      </div>
                      <div className="mt-auto flex w-full flex-col gap-3">
                        <Button
                          className="h-12 w-full !py-0 text-[14px] leading-[48px]"
                          onClick={handleClickAccount}
                        >
                          {t("account.overview.myAccount")}
                        </Button>
                        <a
                          href="https://app.icpswap.com/swap"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 self-center py-1 text-[14px] font-normal text-muted"
                        >
                          {t("account.overview.howToTopUp")}
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
