import PageLayout from "@components/PageLayout";
import Hero from "./components/Hero";
import Utility from "./components/Utility";
import Address from "./components/Address";
import Buy from "./components/Buy";
import Questions from "./components/Questions";
import Staking from "./components/Staking";
import Tokenomics from "./components/Tokenomics";
import Governance from "./components/Governance";

import { useStatsData } from "../../hooks/useStatsData";

const TokenPage = () => {
  const { data: statsData } = useStatsData();

  return (
    <PageLayout>
      <Hero data={statsData} />
      <Utility />
      <Address />
      <Buy />
      <Governance />
      <Staking />
      <Questions />
      <Tokenomics />
    </PageLayout>
  );
}

export default TokenPage;