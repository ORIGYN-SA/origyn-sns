// import { useState, useEffect } from "react";
import { Card } from "@components/ui";
import StakeOGY from "./stake-ogy/StakeOGY";
import useNeurons from "../useNeurons";

const StakedOGY = () => {
  const { stakedOGY } = useNeurons();

  return (
    <Card>
      <div className="flex justify-between mb-4">
        <div className="font-bold text-content/60">Staked OGY</div>
      </div>
      <div className="flex items-center text-2xl font-semibold">
        <img className="h-6 w-6" src="/ogy_logo.svg" alt="OGY Logo" />
        <span className="ml-2 mr-2">{stakedOGY.totalStakedOGY}</span>
        <span className="text-content/60">OGY</span>
      </div>
      <div className="mt-2 text-sm text-content/60">
        {stakedOGY.totalStakedOGYUSD} USD
      </div>
      <div className="mt-8 xl:mt-8">
        <StakeOGY />
      </div>
    </Card>
  );
};

export default StakedOGY;
