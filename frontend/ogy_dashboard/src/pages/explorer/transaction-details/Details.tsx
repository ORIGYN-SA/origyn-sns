import { useMemo, Suspense } from "react";
import { useLoaderData, defer, Await, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Card } from "@components/ui";

export const Loader = async () => {
  const dataProposals = new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "State", value: "Dissolving" },
        { name: "Staked Maturity", value: 0 },
        { name: "Staked OGY", value: "5'424.1231817 OGY" },
        { name: "Dissolve Delay", value: "1 year, 365 days" },
        { name: "Total Maturity", value: 0 },
        { name: "Age", value: "13 days" },
        { name: "Date Created", value: "2024-03-14, 08:01:15 UTC" },
        { name: "Age Bonus", value: "-2.89%" },
        { name: "Total Bonus", value: "+101.78%" },
        { name: "Auto-Stake Maturity", value: "Yes" },
        { name: "Vesting Period", value: "None" },
        { name: "Dissolve Delay Bonus", value: "+100%" },
        { name: "Voting Power", value: "10^944.91" },
      ]);
    }, 300);
  });

  return defer({
    dataProposals: await dataProposals,
  });
};

export const Details = () => {
  const navigate = useNavigate();

  const handleOnClickBack = () => {
    navigate(-1);
  };

  const data = useLoaderData();
  return (
    <div className="container mx-auto pt-8 pb-16">
      <div className="flex flex-col xl:flex-row items-center justify-between py-8">
        <div className="flex flex-col xl:flex-row xl:justify-center items-center gap-4 xl:gap-8">
          <ArrowLeftIcon
            className="h-8 w-8 hover:cursor-pointer"
            onClick={handleOnClickBack}
          />
          <div className="flex flex-col items-center xl:items-start">
            <div className="text-sm">Explorer</div>
            <div className="text-3xl font-bold mb-4 xl:mb-0">
              Transaction Details
            </div>
          </div>
        </div>
        <div>Principal ID: 8329839839283982</div>
      </div>
    </div>
  );
};
