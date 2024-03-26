import { Link } from "react-router-dom";

const Navbar = () => {
  const navItems = [
    { title: "Dashboard", url: "/" },
    { title: "Governance", url: "/governance" },
    { title: "Explorer", url: "/explorer" },
    { title: "Proposals", url: "/proposals" },
  ];
  return (
    <nav className="shadow px-4 py-5 flex justify-between items-center">
      <div className="flex items-center">
        <img
          src="/vite.svg"
          alt="OGY Dashboard Logo"
          className="mr-3 h-6 sm:h-9"
        />
        <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
          OGY Dashboard
        </span>
      </div>
      <div className="flex space-x-4">
        {navItems.map(({ title, url }) => (
          <Link
            to={url}
            className="font-semibold hover:text-blue-600 px-3 py-2 rounded-md"
          >
            {title}
          </Link>
        ))}
      </div>
      <div className="flex items-center">
        <span className="text-gray-500 text-sm mr-2">My Account:</span>
        <span className="text-gray-900 text-sm font-medium mr-3">
          55vo...3dfa
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
