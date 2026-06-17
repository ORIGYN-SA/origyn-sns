import { TokenSupplyData } from "@services/types/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { ApiSupplySummary } from "@services/api/gldt/v1/types";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";

const fetchSupplyDataOGY = async (): Promise<TokenSupplyData> => {
  const { data } = await gldtAPI.get<ApiSupplySummary>(
    gldtTokenPath("supply/summary")
  );
  return {
    total_supply: toBigInt(data.total_supply),
    circulating_supply: toBigInt(data.circulating_supply),
  };
};

export default fetchSupplyDataOGY;
