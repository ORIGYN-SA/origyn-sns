import { Link } from "react-router-dom";
import { Badge } from "./ui";

const NotFound = () => {
  return (
    <div className="w-full flex flex-col justify-center items-center dark:bg-gradient-to-r from-[#232323] via-black to-[#232323] text-white py-28">
      <Badge className="relative flex flex-row items-center justify-center text-6xl  py-8 rounded-xl dark:shadow-lg overflow-hidden">
        <img
          src="/ogy_logo.svg"
          alt="OGY Dashboard Logo"
          className="absolute inset-0 w-32 h-32 object-contain opacity-10 dark:opacity-20"
        />
        <span className="relative z-10 text-black dark:text-white">404</span>
      </Badge>
      <h1 className="text-3xl font-bold mt-6 text-black dark:text-white">
        Oops! Page Not Found
      </h1>
      <p className="text-lg mt-3 max-w-md text-center opacity-80 text-black dark:text-white">
        The page you are looking for might have been removed or is temporarily
        unavailable.
      </p>
      <Link
        to="/"
        className="mt-6 px-8 py-3 text-xl font-semibold text-white bg-[#232323] rounded-full hover:bg-[#232323E2] transition-all shadow-lg"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
