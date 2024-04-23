/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// import { useMemo, Suspense } from "react";
import { useLoaderData, defer, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Card } from "@components/ui";

// interface NeuronsData {
//   name: string;
//   value: number;
// }

const loader = async () => {
  const dataNeurons = new Promise((resolve) => {
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
    dataNeurons: await dataNeurons,
  });
};

export const NeuronsDetails = () => {
  const navigate = useNavigate();

  const handleOnClickBack = () => {
    navigate(-1);
  };

  const data = useLoaderData();
  return (
    <div className="container mx-auto">
      <div className="flex flex-col xl:flex-row items-center justify-between py-8">
        <div className="flex flex-col xl:flex-row xl:justify-center items-center gap-4 xl:gap-8">
          <ArrowLeftIcon
            className="h-8 w-8 hover:cursor-pointer"
            onClick={handleOnClickBack}
          />
          <div className="flex flex-col items-center xl:items-start">
            <div className="text-sm">Governance</div>
            <div className="text-3xl font-bold mb-4 xl:mb-0">OGY Neuron</div>
          </div>
        </div>
        <div>Principal ID: 8329839839283982</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 py-16">
        {data.dataNeurons.map(({ name, value }) => (
          <Card className="bg-surface-2 pb-8" key={name}>
            <div className="flex items-center text-lg">
              <span className="text-content/60">{name}</span>
            </div>
            <div className="flex items-center mt-2 text-2xl font-semibold">
              {value}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

NeuronsDetails.loader = loader;
