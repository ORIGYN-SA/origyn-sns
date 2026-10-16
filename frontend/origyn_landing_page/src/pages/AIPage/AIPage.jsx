import { Link } from "react-router-dom";
import Footer from "@components/Footer/Footer";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";
import { AIDashboardPage } from "@/routes/lazyPages";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Hero from "./components/Hero";
import SignupForm from "./components/SignupForm";
import MarqueeStrip from "./components/MarqueeStrip";
import ProblemSection from "./components/ProblemSection";
import AgentSection from "./components/AgentSection";
import VaultSection from "./components/VaultSection";
import ResultsSection from "./components/ResultsSection";
import VisionSection from "./components/VisionSection";
import MemorySection from "./components/MemorySection";
import NewsletterSection from "./components/NewsletterSection";

const AIPage = () => {
  const t = useT();
  const { locale } = useLocale();
  return (
    <div className="bg-white font-sans text-ink">
      <meta name="theme-color" content="#ffffff" />
      <style>{`html,body{background:#ffffff;color-scheme:light}`}</style>

      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-8 pt-8 pb-10 md:px-16 md:pt-12 md:pb-0">
          {/* Brand lockup stays LTR even in RTL: the logo + "AI" badge are a
              fixed wordmark, not flowing text. The header itself still flips,
              so the lockup sits on the leading (right) edge under dir=rtl. */}
          <div dir="ltr" className="flex items-start">
            <img
              src="/origyn-logo-blue.webp"
              width={480}
              height={112}
              alt="Origyn"
              className="h-7 w-auto md:h-10"
            />
            <span className="ms-1 font-mono text-[10px] italic tracking-[0.08em] text-[#263C85] md:text-[12px]">
              {t("header.badge")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={localePath(locale, "ai/dashboard")}
              onMouseEnter={AIDashboardPage.preload}
              onFocus={AIDashboardPage.preload}
              className="rounded-full bg-navy px-4 py-1.5 text-[0.8125rem] font-medium tracking-wide text-surface transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              {t("header.dashboard")}
            </Link>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center px-6 pb-10 text-center">
          <div className="flex flex-1 flex-col items-center justify-center">
            <Hero />
            <div className="mt-14 w-full max-w-[600px]">
              <SignupForm />
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center gap-2 text-muted">
            <span className="text-[0.7rem] uppercase tracking-[0.18em]">
              {t("scroll")}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-bounce"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </section>

      <MarqueeStrip />
      <ProblemSection />
      <AgentSection />
      <VaultSection />
      <ResultsSection />
      <VisionSection />
      <MemorySection />
      <NewsletterSection />
      <Footer />
    </div>
  );
};

export default AIPage;
