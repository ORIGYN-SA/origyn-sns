import { ActiveUsers } from "@hooks/token_metrics/declarations_files/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { ApiActiveUsers } from "@services/api/gldt/v1/types";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";

const fetchActiveUsersCount = async (): Promise<ActiveUsers> => {
  const { data } = await gldtAPI.get<ApiActiveUsers>(
    gldtTokenPath("active-users")
  );
  return {
    active_accounts_count: toBigInt(data.active_accounts_count),
    active_principals_count: toBigInt(data.active_principals_count),
  };
};

export default fetchActiveUsersCount;
