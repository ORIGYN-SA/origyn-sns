import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import CertifyYourAssets from "./components/CertifyYourAssets/CertifyYourAssets";
import Hero from "./components/Hero/Hero";
import HowItWorks from "./components/HowItWorks/HowItWorks";
import UseCases from "./components/UseCases/UseCases";
import WhyOrigyn from "./components/WhyOrigyn/WhyOrigyn";
import Header from "./components/Header/Header";
import IntegratorProgram from "./components/IntegratorProgram/IntegratorProgram";
// import TokenizedGold from "./components/TokenizedGold/TokenizedGold";
import OurRoadmap from "./components/OurRoadmap/OurRoadmap";
import OurPartners from "./components/OurPartners/OurPartners";
import BePart from "./components/BePart/BePart";
import Footer from "./components/Footer/Footer";
import UseCasesPage from "./components/UseCasesPage/UseCasesPage";
import HelpCenterPage from "./components/HelpCenterPage/HelpCenterPage";
import IntegratorPage from "./components/IntegratorPage/IntegratorPage";
import IntegratorJoinPage from "./components/IntegratorJoinPage/IntegratorJoinPage";
import { useStatsData } from "./hooks/calculator/useStatsData";

function HomePage() {
  const { data: statsData } = useStatsData();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location.hash]);

  return (
    <>
      <Header />
      <Hero data={statsData} />
      <WhyOrigyn />
      <HowItWorks />
      <UseCases id="use-cases" />
      <CertifyYourAssets id="certify-your-assets" />
      <IntegratorProgram id="integrator-program" />
      {/* <TokenizedGold id="gldt" /> */}
      <OurRoadmap />
      <OurPartners id="our-partners" />
      <BePart />
      <Footer />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/use-case/:title" element={<UseCasesPage />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/integrator" element={<IntegratorPage />} />
      <Route path="/integrator/join" element={<IntegratorJoinPage />} />
    </Routes>
  );
}

export default App;
