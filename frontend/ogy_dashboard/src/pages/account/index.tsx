import { useWallet } from "@components/auth/useWallet";
import { PageContainer } from "@components/ui";
import LedgerSwitch from "@pages/account/ledger-switch";
import AvailableOGY from "@pages/account/available-ogy";
import StakedOGY from "@pages/account/staked-ogy";
import StakedRewards from "@pages/account/staked-rewards";
import NeuronsList from "./neurons-list/index";
import PrincipalIdPill from "@components/account/PrincipalIdPill";
import AccountIdPill from "@components/account/AccountIdPill";

export const Account = () => {
  const { principalId, accountId } = useWallet();

  return (
    <PageContainer className="container max-w-none py-8 px-4 sm:py-16">
      <div className="text-center mb-8 sm:mb-16">
        <h1 className="mb-6 sm:mb-8 font-extrabold text-[40px] leading-[44px] sm:text-[64px] sm:leading-[60px] tracking-[-0.05em] text-center text-content">
          Welcome back
        </h1>
        <PrincipalIdPill
          principalId={principalId}
          showCopy
          className="mx-auto max-w-[502px]"
        />
        <AccountIdPill
          accountId={accountId}
          className="mx-auto mt-3 max-w-[502px]"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <AvailableOGY />
        <StakedOGY />
        <StakedRewards />
      </div>
      <div className="mt-8">
        <NeuronsList />
      </div>
      <LedgerSwitch className="mt-8" />
    </PageContainer>
  );
};
