import ledgerAPI from "@services/api/ledger";
import { ACCOUNT_ID_LEDGER_ICP } from "@constants/index";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";

const fetchBalanceICP = async () => {
  const { data } = await ledgerAPI.get(`/accounts/${ACCOUNT_ID_LEDGER_ICP}`);
  const { balance } = data;

  return {
    balance,
    string: {
      balance: roundAndFormatLocale({ number: divideBy1e8(balance) }),
    },
  };
};

export default fetchBalanceICP;
