import { useMemo, Suspense } from "react";
import { useLoaderData, defer, Await } from "react-router-dom";
import TxList from "@pages/explorer/transactions-list/List";

export const Loader = async () => {
  return null;
};

export const Explorer = () => {
  const data = useLoaderData();

  //   const governanceFeatures = useMemo(
  //     () => [
  //       {
  //         title: "Stake & Vote",
  //         description:
  //           "Influence the ORIGYN Network by staking OGY & voting on proposals.",
  //         icon: "",
  //       },
  //       {
  //         title: "Earn Rewards",
  //         description:
  //           "Participate in the decision-making process to earn rewards.",
  //         icon: "",
  //       },
  //       {
  //         title: "Govern Collectively",
  //         description:
  //           "Engage & influence the network as a collaborative ecosystem.",
  //         icon: "",
  //       },
  //     ],
  //     []
  //   );

  return (
    <div className="container mx-auto pb-16">
      <div className="flex flex-col items-center py-16 px-4">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold">Explorer</h1>
        </div>
      </div>
      <div className="mt-8 mb-16">
        <TxList />
      </div>
    </div>
  );
};
