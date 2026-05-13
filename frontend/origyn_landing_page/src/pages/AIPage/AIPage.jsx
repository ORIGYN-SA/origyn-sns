import Footer from "@components/Footer/Footer";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Hero from "./components/Hero";
import SignupForm from "./components/SignupForm";
import ProblemSection from "./components/ProblemSection";
import AgentSection from "./components/AgentSection";
import VaultSection from "./components/VaultSection";
import ResultsSection from "./components/ResultsSection";
import VisionSection from "./components/VisionSection";
import NewsletterSection from "./components/NewsletterSection";

const AIPage = () => (
  <div className="bg-canvas font-sans text-ink">
    <section className="flex min-h-screen flex-col">
      <header className="flex items-start justify-between px-8 pt-8 md:px-16 md:pt-12">
        {/* Logo slot — intentionally empty */}
        <div className="h-10 w-44" aria-hidden="true" />
        <LanguageSwitcher />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-32 text-center">
        <Hero />
        <SignupForm />
      </div>
    </section>

    <ProblemSection />
    <AgentSection />
    <VaultSection />
    <ResultsSection />
    <VisionSection />
    <NewsletterSection />
    <Footer />
  </div>
);

export default AIPage;
