import { LockedNeuronsPeriodResponse } from "@services/types/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import {
  ApiGovernanceStats,
  ApiLockedBracket,
} from "@services/api/gldt/v1/types";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";

const mapLockedBracket = (
  bracket: ApiLockedBracket<string | number>
): LockedNeuronsPeriodResponse["amount"] => ({
  one_year: toBigInt(bracket.one_year),
  two_years: toBigInt(bracket.two_years),
  three_years: toBigInt(bracket.three_years),
  four_years: toBigInt(bracket.four_years),
  five_years: toBigInt(bracket.five_years),
});

const fetchEstimatedRewards =
  async (): Promise<LockedNeuronsPeriodResponse> => {
    try {
      const { data } = await gldtAPI.get<ApiGovernanceStats>(
        gldtTokenPath("governance/stats")
      );
      const { locked_amount, locked_count } = data;
      return {
        amount: mapLockedBracket(locked_amount),
        count: mapLockedBracket(locked_count),
      };
    } catch (error) {
      console.error("Error fetching estimated rewards:", error);
      throw error;
    }
  };

export default fetchEstimatedRewards;
