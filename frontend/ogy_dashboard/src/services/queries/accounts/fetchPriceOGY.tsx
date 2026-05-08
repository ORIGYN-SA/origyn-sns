import ogyAPI from "@services/api/ogy";
import fetchOGYPriceFromICPSwap from "@services/icpswap/fetchOGYPriceFromICPSwap";

const fetchPriceOGY = async () => {
  try {
    const price = await fetchOGYPriceFromICPSwap();
    return { ogyPrice: String(price) };
  } catch (icpswapError) {
    console.warn(
      "ICPSwap price fetch failed, falling back to api.origyn.com",
      icpswapError
    );
    const { data } = await ogyAPI.get(`/ogy/price`);
    return { ogyPrice: data.ogyPrice };
  }
};

export default fetchPriceOGY;
