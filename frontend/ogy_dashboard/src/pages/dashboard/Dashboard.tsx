import TotalOGYSupply from "@pages/dashboard/components/total-ogy-supply/TotalOGYSupply";

const Dashboard = () => {
  return (
    <div className="container mx-auto">
      <div className="p-16 flex flex-col items-center">
        <span className="text-sm font-semibold uppercase tracking-wider">
          OGY Analytics
        </span>
        <h1 className="text-6xl font-extrabold text-center mt-2">
          Explore dashboard
        </h1>
        <p className="mt-3 text-lg text-center px-6">
          Interact trustlessly with web3 dApps, DAOs, NFTs, DeFi and much more.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 w-full py-16 gap-8">
          <TotalOGYSupply className="w-full" />
          <TotalOGYSupply className="w-full" />
          <TotalOGYSupply className="w-full" />
          <TotalOGYSupply className="w-full" />
          <TotalOGYSupply className="w-full col-span-1 xl:col-span-2" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
