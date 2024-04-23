import useConnect from "@helpers/useConnect";
import useFetchBalanceOGYLegacy from "@services/accounts/useFetchBalanceOGYLegacy";

const Deposit = () => {
  const { principalShort } = useConnect();

  const { data } = useFetchBalanceOGYLegacy();
  return (
    <div className="border border-surface-2 rounded-xl mt-4">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>Legacy OGY Balance</div>
        <div className="">
          <div className="text-xl">{data ?? 0} OGY</div>
          <div className="text-sm">0 USD</div>
        </div>
      </div>
      <div className="bg-surface-2 text-content/60 p-4">
        <span>Account ID: </span>
        <span>{principalShort}</span>
      </div>
    </div>
  );
};

export default Deposit;
