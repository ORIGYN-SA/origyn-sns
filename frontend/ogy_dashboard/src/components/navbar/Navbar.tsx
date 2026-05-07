import { useState, Fragment } from "react";
import { NavLink } from "react-router-dom";
import { useWallet } from "@components/auth/useWallet";
import {
  Transition,
  TransitionChild,
  Dialog,
  DialogPanel,
} from "@headlessui/react";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/20/solid";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Auth from "@components/auth/Auth";
import BrandLogo from "@components/brand/BrandLogo";
import AccountOverview from "@components/account/overview/AccountOverview";
import PrincipalIdPill from "@components/account/PrincipalIdPill";
import { Button } from "@components/ui";
import useHideOnScrollDown from "@hooks/useHideOnScrollDown";
import useScrolledPast from "@hooks/useScrolledPast";

const navItems: { title: string; url: string; requiresAuth?: boolean }[] = [
  { title: "Dashboard", url: "/" },
  { title: "Governance", url: "/governance" },
  { title: "Transaction History", url: "/transaction-history" },
  { title: "Calculator", url: "/calculator" },
];

const Navbar = ({ roundedTop = false }: { roundedTop?: boolean }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountOverview, setShowAccountOverview] = useState(false);
  const {
    isConnected,
    principalId,
    handleOpenWalletList,
    handleDisconnectWallet,
  } = useWallet();
  const hidden = useHideOnScrollDown();
  const pastWarning = useScrolledPast(30);
  const showRounded = roundedTop && !pastWarning;

  const effectiveShowAccountOverview = showAccountOverview && isConnected;
  const visibleNavItems = navItems.filter(
    (item) => !item.requiresAuth || isConnected
  );

  const handleOnClickShowAccountOverview = (show: boolean) =>
    setShowAccountOverview(show);

  const handleOnHideMenu = () => setShowMenu(false);

  const handleOnClickConnect = () => {
    handleOnHideMenu();
    handleOpenWalletList();
  };

  const handleOnClickDisconnect = async () => {
    handleOnHideMenu();
    await handleDisconnectWallet();
  };

  const handleOnClickViewAccount = () => {
    handleOnHideMenu();
    handleOnClickShowAccountOverview(true);
  };

  return (
    <>
      <nav
        className={`bg-surface-1 sticky top-0 border-b border-border-strong z-40 transition-[transform,border-radius] duration-300 ease-in-out ${
          showRounded ? "rounded-t-2xl" : "rounded-t-none"
        } ${hidden ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="grid grid-cols-2 xl:grid-cols-5 items-stretch h-20 max-w-[1440px] mx-auto px-6">
          <div className="col-start-1 col-end-1 flex-shrink-0 flex items-center text-content">
            <BrandLogo labelClassName="hidden sm:block" />
          </div>
          <div className="hidden xl:block justify-self-center col-start-2 col-end-5 h-full">
            <div className="flex items-stretch space-x-12 h-full">
              {visibleNavItems.map(({ title, url }) => (
                <NavLink
                  to={url}
                  end={url === "/"}
                  className={({ isActive }) =>
                    `relative flex items-center font-semibold text-[16px] leading-none ${
                      isActive
                        ? "text-content"
                        : "text-muted hover:text-content"
                    }`
                  }
                  key={url}
                >
                  {({ isActive }) => (
                    <>
                      {title}
                      {isActive && (
                        <span className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-content" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex justify-self-end items-center gap-3 col-start-5">
            {!isConnected && <Auth />}
            {isConnected && (
              <button
                type="button"
                onClick={() => handleOnClickShowAccountOverview(true)}
              >
                <PrincipalIdPill principalId={principalId} variant="short" />
              </button>
            )}

            <div className="xl:hidden">
              <button
                onClick={() => setShowMenu(!showMenu)}
                type="button"
                aria-label="Open main menu"
                className="inline-flex items-center justify-center h-[47px] w-[47px] rounded-full border border-[#E9EAF1] bg-[#F9FAFE] text-content hover:bg-[#F1F3F9] hover:border-[#D6D9E2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-content/30"
              >
                <Bars3Icon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <Transition show={showMenu} as={Fragment}>
          <Dialog
            as="div"
            static
            open={showMenu}
            onClose={handleOnHideMenu}
            className="fixed inset-0 z-50"
          >
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
              />
            </TransitionChild>

            <div className="fixed inset-x-0 top-0 flex max-h-screen">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="-translate-y-4 opacity-0"
                enterTo="translate-y-0 opacity-100"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-y-0 opacity-100"
                leaveTo="-translate-y-4 opacity-0"
              >
                <DialogPanel className="relative w-full bg-background rounded-b-2xl shadow-2xl flex flex-col max-h-screen overflow-y-auto">
                  <div className="flex items-center justify-between h-20 px-6 border-b border-border-strong shrink-0">
                    <BrandLogo />
                    <button
                      onClick={handleOnHideMenu}
                      type="button"
                      aria-label="Close menu"
                      className="inline-flex items-center justify-center p-2 rounded-full hover:bg-surface-2 focus:outline-none"
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 px-4 py-4">
                    {visibleNavItems.map(({ title, url }) => (
                      <NavLink
                        key={url}
                        to={url}
                        end={url === "/"}
                        onClick={handleOnHideMenu}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-4 py-3.5 rounded-xl text-[16px] font-semibold transition-colors ${
                            isActive
                              ? "bg-surface-2 text-content"
                              : "text-muted hover:bg-surface-2 hover:text-content"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span>{title}</span>
                            <ChevronRightIcon
                              className={`h-4 w-4 shrink-0 ${
                                isActive ? "text-content" : "text-muted"
                              }`}
                              aria-hidden="true"
                            />
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>

                  <div className="border-t border-border-strong px-6 py-5 shrink-0">
                    {!isConnected ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-[13px] leading-snug text-muted">
                          Connect your wallet to manage tokens, vote on
                          proposals and view your transaction history.
                        </p>
                        <Button
                          onClick={handleOnClickConnect}
                          className="w-full !py-0 text-[14px] leading-[48px]"
                        >
                          Connect wallet
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          onClick={handleOnClickViewAccount}
                          aria-label="View account overview"
                          className="w-full text-left rounded-[100px] focus:outline-none focus-visible:ring-2 focus-visible:ring-content/30"
                        >
                          <PrincipalIdPill
                            principalId={principalId}
                            variant="long"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={handleOnClickDisconnect}
                          className="w-full h-12 rounded-full border border-border-strong text-[14px] font-semibold text-content hover:bg-surface-2 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </Dialog>
        </Transition>
      </nav>

      <AccountOverview
        show={effectiveShowAccountOverview}
        handleClose={() => handleOnClickShowAccountOverview(false)}
      />
    </>
  );
};

export default Navbar;
