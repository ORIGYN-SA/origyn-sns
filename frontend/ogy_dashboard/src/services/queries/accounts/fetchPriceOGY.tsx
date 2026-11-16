import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import fetchOGYPriceFromICPSwap from "@services/icpswap/fetchOGYPriceFromICPSwap";

const fetchPriceOGY = async () => {
  try {
    const price = await fetchOGYPriceFromICPSwap();
    return { ogyPrice: String(price) };
  } catch (icpswapError) {
    console.warn(
      "ICPSwap price fetch failed, falling back to the api.gldt.org daily price",
      icpswapError
    );
    const history = await gldtEndpoints.getPriceHistory();
    const latest = history[history.length - 1];
    if (!latest) throw new Error("api.gldt.org returned no OGY price");
    return { ogyPrice: String(latest.price) };
  }
};

export default fetchPriceOGY;
