import { Actor, HttpAgent } from "@dfinity/agent";
import {
  ICPSWAP_OGY_ICP_POOL_CANISTER_ID,
  ICPSWAP_ICP_CKUSDC_POOL_CANISTER_ID,
} from "@constants/index";
import { getAnonAgent } from "@services/actor";
import { idlFactory as swapPoolIdl } from "./swap_pool";

const OGY_DECIMALS = 8;
const CKUSDC_DECIMALS = 6;
const QUOTE_TIMEOUT_MS = 5000;

type QuoteResult = { ok: bigint } | { err: unknown };
type SwapPoolActor = {
  quote: (args: {
    amountIn: string;
    zeroForOne: boolean;
    amountOutMinimum: string;
  }) => Promise<QuoteResult>;
};

const withTimeout = <T>(p: Promise<T>, ms: number, label: string) =>
  Promise.race<T>([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);

const quoteLeg = async (
  agent: HttpAgent,
  poolCanisterId: string,
  amountIn: bigint
): Promise<bigint> => {
  const actor = Actor.createActor<SwapPoolActor>(swapPoolIdl, {
    agent,
    canisterId: poolCanisterId,
  });
  const result = await withTimeout(
    actor.quote({
      amountIn: amountIn.toString(),
      zeroForOne: true,
      amountOutMinimum: "0",
    }),
    QUOTE_TIMEOUT_MS,
    `ICPSwap quote ${poolCanisterId}`
  );
  if ("err" in result) {
    throw new Error(`ICPSwap quote err: ${JSON.stringify(result.err)}`);
  }
  return result.ok;
};

const fetchOGYPriceFromICPSwap = async (): Promise<number> => {
  const agent = getAnonAgent();
  const oneOgy = 10n ** BigInt(OGY_DECIMALS);
  const icpAmount = await quoteLeg(
    agent,
    ICPSWAP_OGY_ICP_POOL_CANISTER_ID,
    oneOgy
  );
  const ckusdcAmount = await quoteLeg(
    agent,
    ICPSWAP_ICP_CKUSDC_POOL_CANISTER_ID,
    icpAmount
  );
  return Number(ckusdcAmount) / 10 ** CKUSDC_DECIMALS;
};

export default fetchOGYPriceFromICPSwap;
