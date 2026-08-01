import PageLayout from "@components/PageLayout";
import Hero from "./components/Hero";
import WhatIsOrigyn from "./components/WhatIsOrigyn";
import Regulation from "./components/Regulation";
import WhyOrigyn from "./components/WhyOrigyn";
import BuildVsBuy from "./components/BuildVsBuy";
import PartnerModel from "./components/PartnerModel";
import DownloadGate from "./components/DownloadGate";
import CtaBand from "./components/CtaBand";

const DPPPage = () => (
  <PageLayout>
    <main className="bg-white font-sans text-ink">
      <Hero />
      <WhatIsOrigyn />
      <Regulation />
      <WhyOrigyn />
      <BuildVsBuy />
      <PartnerModel />
      <DownloadGate />
      <CtaBand />
    </main>
  </PageLayout>
);

export default DPPPage;
