import {
  SwapTokensProvider,
  BtnSwapTokens,
  DialogSwapTokens,
} from "./swap-tokens";

const SwapTokens = () => {
  return (
    <>
      <SwapTokensProvider>
        <BtnSwapTokens />
        <DialogSwapTokens />
      </SwapTokensProvider>
    </>
  );
};

export default SwapTokens;
