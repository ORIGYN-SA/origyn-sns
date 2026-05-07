import { useWallet } from "@components/auth/useWallet";
import { PageContainer } from "@components/ui";
import LedgerSwitch from "@pages/account/ledger-switch";
import AvailableOGY from "@pages/account/available-ogy";
import StakedOGY from "@pages/account/staked-ogy";
import StakedRewards from "@pages/account/staked-rewards";
import NeuronsList from "./neurons-list/index";
import PrincipalIdPill from "@components/account/PrincipalIdPill";

export const Account = () => {
  const { principalId } = useWallet();

  return (
    <PageContainer className="container max-w-none py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="mb-8 font-extrabold text-[64px] leading-[60px] tracking-[-0.05em] text-center text-content">
          Welcome back
        </h1>
        <PrincipalIdPill
          principalId={principalId}
          showCopy
          className="mx-auto max-w-[502px]"
        />
      </div>
      <LedgerSwitch className="mb-8" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <AvailableOGY />
        <StakedOGY />
        <StakedRewards />
      </div>
      <div className="mt-16">
        <NeuronsList />
      </div>
    </PageContainer>
  );
};
