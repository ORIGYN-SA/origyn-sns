import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { title: "Dashboard", url: "/" },
    { title: "Governance", url: "/governance" },
    { title: "Explorer", url: "/explorer" },
    { title: "Proposals", url: "/proposals" },
  ];
  return (
    <nav className="bg-background sticky top-0 shadow px-6 py-5">
      <div className="flex justify-between items-center">
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/vite.svg" alt="OGY Dashboard Logo" />
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
                className="font-semibold hover:text-blue-600"
                key={i}
              >
                {title}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex items-center">
            <span className="text-sm mr-2 hidden sm:block">My Account:</span>
            <span className="text-sm font-medium mr-3">55vo...3dfa</span>
          </div>
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-200 focus:outline-none"
            >
              {/* Icon for mobile menu button */}
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? "block" : "hidden"} lg:hidden`}>
        <div className="flex flex-col items-center px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map(({ title, url }, i) => (
            <Link
              to={url}
              className="font-semibold hover:text-blue-600 px-3 py-2 rounded-md"
              key={i}
            >
              {title}
            </Link>
          ))}
        </div>
      </div>
    </nav>

    // <nav className="fixed shadow px-4 py-5 flex justify-between items-center">
    //   <div className="flex items-center">
    //     <img
    //       src="/vite.svg"
    //       alt="OGY Dashboard Logo"
    //       className="mr-3 h-6 sm:h-9"
    //     />
    //     <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
    //       OGY Dashboard
    //     </span>
    //   </div>
    //   <div className="flex space-x-4">
    //     {navItems.map(({ title, url }) => (
    //       <Link
    //         to={url}
    //         className="font-semibold hover:text-blue-600 px-3 py-2 rounded-md"
    //       >
    //         {title}
    //       </Link>
    //     ))}
    //   </div>
    //   <div className="flex items-center">
    //     <span className="text-gray-500 text-sm mr-2">My Account:</span>
    //     <span className="text-gray-900 text-sm font-medium mr-3">
    //       55vo...3dfa
    //     </span>
    //   </div>
    // </nav>
  );
};

export default Navbar;
