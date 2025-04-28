import CertifyYourAssets from "./components/CertifyYourAssets/CertifyYourAssets";
import Hero from "./components/Hero/Hero";
import HowItWorks from "./components/HowItWorks/HowItWorks";
import UseCases from "./components/UseCases/UseCases";
import WhyOrigyn from "./components/WhyOrigyn/WhyOrigyn";
import Header from "./components/Header/Header";
import IntegratorProgram from "./components/IntegratorProgram/IntegratorProgram";
import OurRoadmap from "./components/OurRoadmap/OurRoadmap";
import OurPartners from "./components/OurPartners/OurPartners";
import BePart from "./components/BePart/BePart";
import Footer from "./components/Footer/Footer";
import { useStatsData } from "./hooks/calculator/useStatsData";
import "./styles/global.css";

function App() {
  const { data: statsData } = useStatsData();

  return (
    <>
      <Header />
      <Hero data={statsData} />
      <WhyOrigyn />
      <HowItWorks />
      <UseCases id="use-cases" />
      <CertifyYourAssets id="certify-your-assets" />
      <IntegratorProgram id="integrator-program" />
      <OurRoadmap />
      <OurPartners id="our-partners" />
      <BePart />
      <Footer />
    </>
  );
}

export default App;
