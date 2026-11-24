import { Outlet, useNavigation } from "react-router-dom";

const NavigationProgress = () => {
  return (
    <div className="flex items-center justify-center my-32 xl:my-64">
      <div className="text-center">
        <div className="border-4 xl:border-8 border-accent/20 border-t-accent h-16 w-16 xl:h-32 xl:w-32 animate-spin rounded-full" />
      </div>
    </div>
  );
};

const Layout = () => {
  const navigation = useNavigation();

  return (
    <div className={`flex flex-col min-h-screen`}>
      <div className="flex-grow">
        {navigation.state !== "idle" ? <NavigationProgress /> : <Outlet />}
      </div>
    </div>
  );
};

export default Layout;
