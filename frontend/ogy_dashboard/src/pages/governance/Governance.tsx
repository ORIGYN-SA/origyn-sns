import { useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import EstimateRewards from "@pages/governance/components/estimate-rewards/EstimateRewards";
import Card from "@components/cards/Card";

export async function GovernanceLoader() {
  return null;
}

export const Governance = () => {
  const data = useLoaderData() as string;

  const governanceFeatures = useMemo(
    () => [
      {
        title: "Stake & Vote",
        description:
          "Influence the ORIGYN Network by staking OGY & voting on proposals.",
        icon: "",
      },
      {
        title: "Earn Rewards",
        description:
          "Participate in the decision-making process to earn rewards.",
        icon: "",
      },
      {
        title: "Govern Collectively",
        description:
          "Engage & influence the network as a collaborative ecosystem.",
        icon: "",
      },
    ],
    []
  );

  return (
    <div className="container mx-auto">
      <div className="flex flex-col items-center py-16 px-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 w-full py-16 gap-8">
          <div className="pr-0 xl:pr-16 pb-16 xl:pb-0 text-center xl:text-left">
            <h1 className="text-4xl sm:text-6xl font-extrabold">
              Governance Overview
            </h1>
            <h2 className="mt-2 text-xl text-content/60">
              Welcome to ORIGYN Governance!
            </h2>
            <p className="mt-6  text-content/60">
              Holders of OGY tokens can directly influence the ORIGYN Network by
              staking their OGY and voting on proposals. By participating in the
              decision-making process, these staked token holders earn rewards .
            </p>
          </div>
          <EstimateRewards />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 w-full py-16 gap-8">
          {governanceFeatures.map(({ title, description, icon }) => (
            <Card key={title}>
              <div className="flex">
                <div className="shrink-0 w-16 h-16 flex items-center justify-center bg-blue-50/50 rounded-lg">
                  {icon}
                </div>
                <div className="ml-8">
                  <div className="font-semibold">{title}</div>
                  <div className="text-content/60">{description}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex justify-between">TOKEN in Governance</div>
      </div>

      {/* <div className="py-16 px-4 flex flex-col items-center">
        <div className="py-16 flex flex-col items-center">
          <span className="text-sm font-semibold uppercase tracking-wider">
            OGY Analytics
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-center mt-2">
            Explore dashboard
          </h1>
          <p className="mt-3 text-lg text-center px-6">prout</p>
        </div>
      </div> */}
    </div>
  );
};
