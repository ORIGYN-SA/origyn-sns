import { useState, Fragment } from "react";
import { Link, NavLink } from "react-router-dom";
import { useWallet } from "@components/auth/useWallet";
import { Transition, TransitionChild, Dialog } from "@headlessui/react";
import { XMarkIcon, Bars3Icon, UserIcon } from "@heroicons/react/20/solid";
import Auth from "@components/auth/Auth";
import BrandLogo from "@components/brand/BrandLogo";
import AccountOverview from "@components/account/overview/AccountOverview";
import { Tile, Skeleton, Tooltip } from "@components/ui";
import useHideOnScrollDown from "@hooks/useHideOnScrollDown";
import useScrolledPast from "@hooks/useScrolledPast";

const navItems: { title: string; url: string; requiresAuth?: boolean }[] = [
  { title: "Dashboard", url: "/" },
  { title: "Governance", url: "/governance" },
  { title: "Transaction History", url: "/transaction-history" },
  { title: "Calculator", url: "/calculator" },
  { title: "My Account", url: "/account", requiresAuth: true },
];

const Navbar = ({ roundedTop = false }: { roundedTop?: boolean }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountOverview, setShowAccountOverview] = useState(false);
  const { isConnected, principalId } = useWallet();
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
          <div className="flex justify-self-end items-center col-start-5">
            {!isConnected && <Auth />}
            {isConnected && (
              <button
                className="flex items-center bg-surface-2 rounded-full py-1 px-1"
                onClick={() => handleOnClickShowAccountOverview(true)}
              >
                <div className="flex items-center">
                  <Tile className="rounded-full h-8 w-8 bg-surface-3">
                    <UserIcon className="p-1 text-white" />
                  </Tile>
                  <div className="hidden sm:block">
                    <div className="flex items-center truncate pr-4">
                      <div className="flex ml-4 items-center truncate text-sm max-w-64">
                        <div className="mr-2 shrink-0">Principal ID: </div>
                        {principalId ? (
                          <Tooltip content={principalId}>
                            <div className="truncate">{principalId}</div>
                          </Tooltip>
                        ) : (
                          <Skeleton className="w-64" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )}

            <div className="xl:hidden">
              <button
                onClick={() => setShowMenu(!showMenu)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-surface-2 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <Transition show={showMenu} as={Fragment}>
          <div className="fixed z-50 inset-0 overflow-hidden">
            <Dialog
              as={Fragment}
              static
              open={showMenu}
              onClose={handleOnHideMenu}
            >
              <div
                className="absolute z-50 inset-0 overflow-hidden"
                aria-hidden="true"
                onClick={() => setShowMenu(false)}
              >
                <TransitionChild
                  as={Fragment}
                  enter="ease-in-out duration-500"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-500"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="fixed w-full inset-0 bg-black bg-opacity-50 transition-opacity" />
                </TransitionChild>
                <div className="fixed inset-x-0 top-0 w-full flex">
                  <TransitionChild
                    as={Fragment}
                    enter="transform transition ease-in-out duration-500 sm:duration-700"
                    enterFrom="-translate-y-full"
                    enterTo="translate-y-0"
                    leave="transform transition ease-in-out duration-500 sm:duration-700"
                    leaveFrom="translate-y-0"
                    leaveTo="-translate-y-full"
                  >
                    <div className="bg-background w-full px-8 py-5">
                      <div className="flex flex-col items-center px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <div className="flex items-center justify-between w-full mb-4">
                          <BrandLogo className="pr-4" />
                          <button
                            onClick={() => setShowMenu(!showMenu)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-surface-2 focus:outline-none"
                          >
                            <span className="sr-only">Open main menu</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>

                        {visibleNavItems.map(({ title, url }) => (
                          <Link
                            onClick={handleOnHideMenu}
                            to={url}
                            className="font-semibold text-muted hover:text-content px-3 py-2 rounded-md"
                            key={url}
                          >
                            {title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </TransitionChild>
                </div>
              </div>
            </Dialog>
          </div>
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
