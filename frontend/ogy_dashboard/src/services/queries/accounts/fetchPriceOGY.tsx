import ogyAPI from "@services/api/ogy";

const fetchPriceOGY = async () => {
  const { data } = await ogyAPI.get(`/price`);
  const { ogyPrice } = data;

  return {
    ogyPrice,
  };
};

export default fetchPriceOGY;
