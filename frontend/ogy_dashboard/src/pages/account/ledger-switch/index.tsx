import { ReactNode } from "react";
import useConnect from "@helpers/useConnect";
import { Button } from "@components/ui";
import useFakeLegacyOrigynDashboardIdentity from "@services/accounts/useFakeLegacyDashboardOGYIdentity";
import WithdrawLegacyTokens from "@pages/account/ledger-switch/withdraw-legacy-tokens/index";

const DepositComponent = () => {
  const { principalShort } = useConnect();
  return (
    <div className="border border-surface-2 rounded-xl mt-4">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>Legacy OGY Balance</div>
        <div className="">
          <div className="text-xl">0 OGY</div>
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

const LedgerSwitch = ({ className, ...restProps }) => {
  const { principal: principalLegacyDashboadOGY } =
    useFakeLegacyOrigynDashboardIdentity();

  const cards = [
    {
      title: "Step 1: Withdraw from old governance",
      subtitle:
        "If you were previously participating in OGY governance, you need to withdraw those tokens before you can swap them.",
      children: (
        <div className="mt-4 xl:mt-8">
          <WithdrawLegacyTokens />
        </div>
      ),
    },
    {
      title: "Step 2: Deposit to your account",
      subtitle:
        "If you have any tokens outside of the OGY dashboard, deposit them to your account-id before you can start to swap them.",
      children: <DepositComponent />,
    },
    {
      title: "Step 3: Swap tokens",
      subtitle: "Swap the legacy OGY token to the new ledger.",
      children: (
        <Button className="mt-4 xl:mt-8 w-full">Swap your tokens</Button>
      ),
    },
  ];

  return (
    <div className={className} {...restProps}>
      <div className="shadow-md">
        <div className="bg-charcoal text-white px-8 pt-8 pb-16 rounded-t-xl">
          <div className="text-center text-sm mb-16">
            IMPORTANT INFORMATION Ledger Switch
          </div>
          <div className="text-center text-4xl mb-8">
            We are switching ledger
          </div>
          <div className="grid xl:grid-cols-4">
            <div className="col-start-2 col-span-2 text-center">
              <p>ORIGYN governance and ledger have been upgraded to an SNS. </p>
              <p>
                In order to continue participating in ORIGYN governance and
                utilise OGY, you need to swap your OGY tokens.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface p-8 rounded-b-xl">
          <div className="grid xl:grid-cols-3 gap-8">
            {cards.map(({ title, subtitle, children }) => {
              return (
                <div
                  className="flex flex-col p-4 border border-surface-2 rounded-lg"
                  key={title}
                >
                  <div className="font-semibold">{title}</div>
                  <div className="text-content/60">{subtitle}</div>
                  <div>{children as ReactNode}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerSwitch;
