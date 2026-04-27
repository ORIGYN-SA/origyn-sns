import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageLayout from "@components/PageLayout";
import Hero from "@components/Hero";
import WhyOrigyn from "@components/WhyOrigyn";
import HowItWorks from "@components/HowItWorks";
import UseCases from "@components/UseCases";
import CertifyYourAssets from "@components/CertifyYourAssets";
import IntegratorProgram from "@components/IntegratorProgram";
import OurRoadmap from "@components/OurRoadmap";
import OurPartners from "@components/OurPartners";
import BePart from "@components/BePart";
import { useStatsData } from "../../hooks/useStatsData";

const HomePage = () => {
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
    <PageLayout>
      <Hero data={statsData} />
      <WhyOrigyn />
      <HowItWorks />
      <UseCases id="use-cases" />
      <CertifyYourAssets id="certify-your-assets" />
      <IntegratorProgram id="integrator-program" />
      <OurRoadmap />
      <OurPartners id="our-partners" />
      <BePart />
    </PageLayout>
  );
};

export default HomePage;
