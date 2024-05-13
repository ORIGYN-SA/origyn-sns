// import { useEffect, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import ogyAPI from "@services/_api/ogy";

export const fetchPriceOGY = async () => {
  const { data: dataOGYPrice } = await ogyAPI.get(`/price`);
  const { ogyPrice } = dataOGYPrice;

  return {
    ogyPrice,
  };
};

const useFetchPriceOGY = ({ enabled = true }: { enabled?: boolean }) => {
  const { principal, isConnected } = useConnect();
  const [ledgerActor] = useCanister("ledger");

  return {
    queryKey: ["fetchPriceOGY", ledgerActor, principal, isConnected],
    queryFn: () => fetchPriceOGY(),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!principal && !!enabled,
    refetchOnWindowFocus: !!enabled,
  };
};

export default useFetchPriceOGY;
