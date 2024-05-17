import { useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { useConnect } from "@connect2ic/react";
import { Transition, Dialog } from "@headlessui/react";
import { XMarkIcon, Bars3Icon, UserIcon } from "@heroicons/react/20/solid";
import Auth from "@components/auth/Auth";
import AccountOverview from "@components/account/overview/AccountOverview";
import { Tile } from "@components/ui";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountOverview, setShowAccountOverview] = useState(false);
  const { isConnected, isInitializing, principal } = useConnect();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const [, setSearchParams] = useSearchParams();

  const navItems = [
    { title: "Dashboard", url: "/" },
    { title: "Governance", url: "/governance" },
    { title: "Explorer", url: "/explorer" },
    { title: "Proposals", url: "/proposals" },
  ];

  const handleOnClickShowAccountOverview = (show: boolean) =>
    setShowAccountOverview(show);

  const handleOnHideMenu = () => setShowMenu(false);

  return (
    <>
      <nav className="bg-background sticky top-0 shadow px-6 py-5 z-40">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/ogy_logo.svg" alt="OGY Dashboard Logo" />
              <span className="self-center text-xl font-semibold whitespace-nowrap hidden sm:block">
                OGY Dashboard
              </span>
            </Link>
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center space-x-12">
              {navItems.map(({ title, url }, i) => (
                <Link
                  to={url}
                  className="font-semibold text-content/60 hover:text-content"
                  key={i}
                >
                  {title}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            {!isInitializing && !isConnected && <Auth />}
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
                    <div className="ml-4 flex items-center text-sm max-w-xs pr-4">
                      <span className="font-semibold mr-2 shrink-0">
                        My Account:
                      </span>
                      <span className="truncate">{principal}</span>
                    </div>
                  </div>
                </div>
              </button>
            )}

            <div className="lg:hidden">
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
              <div className="absolute z-50 inset-0 overflow-hidden">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-500"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-500"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Dialog.Overlay className="fixed w-full inset-0 bg-black bg-opacity-50 transition-opacity" />
                </Transition.Child>
                <div className="fixed inset-x-0 top-0 w-full flex">
                  <Transition.Child
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
                          <Link to="/" className="flex items-center pr-4">
                            <img src="/ogy_logo.svg" alt="OGY Dashboard Logo" />
                            <span className="self-center text-xl font-semibold whitespace-nowrap">
                              OGY Dashboard
                            </span>
                          </Link>
                          <button
                            onClick={() => setShowMenu(!showMenu)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-surface-2 focus:outline-none"
                          >
                            <span className="sr-only">Open main menu</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>

                        {navItems.map(({ title, url }, i) => (
                          <Link
                            onClick={handleOnHideMenu}
                            to={url}
                            className="font-semibold text-content/60 hover:text-content px-3 py-2 rounded-md"
                            key={i}
                          >
                            {title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </div>
        </Transition>
      </nav>

      <AccountOverview
        show={showAccountOverview}
        handleClose={() => handleOnClickShowAccountOverview(false)}
      />
    </>
  );
};

export default Navbar;
