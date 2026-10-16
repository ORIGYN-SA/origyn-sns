import { ClerkProvider, SignIn, UserButton, useAuth } from "@clerk/react";
import { usePrefetchQuery } from "@tanstack/react-query";
import { AnimatePresence, MotionConfig, motion as Motion } from "motion/react";
import { preconnect } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";
import { CREDITS_URL, GATEWAY_URL } from "./api";
import { DEFAULT_USD_CENTS } from "./format";
import { collapse } from "./motion";
import { quoteOptions, useSession } from "./queries";
import ApiKeys from "./components/ApiKeys";
import BalanceCard from "./components/BalanceCard";
import BuyCredits from "./components/BuyCredits";
import OrderStatusBanner from "./components/OrderStatusBanner";
import Purchases from "./components/Purchases";
import SessionError from "./components/SessionError";
import Toaster from "./components/Toaster";
import { AutoHeight, Skeleton } from "./components/ui";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const DOCS_URL = "https://origyn.gitbook.io/origyn/origyn-nft/";
// A publishable key is pk_<env>_<base64 of "<frontend api host>$">.
const CLERK_ORIGIN = `https://${atob(PUBLISHABLE_KEY.split("_")[2]).replace(/\$$/, "")}`;

// Rendered while Clerk loads as well as once signed in: every panel draws
// its own skeleton until its data lands, so a returning user sees the final
// layout from the first frame instead of a spinner.
const Dashboard = () => {
  const session = useSession();
  const [searchParams] = useSearchParams();
  const orderId =
    searchParams.get("checkout") === "cancelled"
      ? null
      : searchParams.get("order");

  if (session.error) return <SessionError session={session} />;

  return (
    <div className="flex flex-col">
      {/* The banner's gap lives inside it, so dismissing it slides the page
          up by its full height instead of leaving a jump of one gap. */}
      <AnimatePresence initial={false}>
        {orderId && (
          <Motion.div key={orderId} {...collapse}>
            <div className="pb-6">
              <AutoHeight>
                <OrderStatusBanner orderId={orderId} />
              </AutoHeight>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-6">
          <BalanceCard />
          <BuyCredits />
        </div>
        <div className="flex flex-col gap-6">
          <ApiKeys />
          <Purchases />
        </div>
      </div>
    </div>
  );
};

const Content = () => {
  const t = useT();
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex justify-center pt-8">
        <SignIn routing="hash" withSignUp />
      </div>
    );
  }
  return (
    <>
      <h1 className="mb-10 text-[clamp(2rem,5vw,3.25rem)] font-extralight leading-tight tracking-normal">
        {t("aiDashboard.title")}
      </h1>
      <Dashboard />
    </>
  );
};

const Account = () => {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Skeleton className="h-7 w-7 rounded-full" />;
  return isSignedIn ? <UserButton /> : null;
};

const AIDashboardPage = () => {
  const t = useT();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const aiPage = localePath(locale, "ai");
  const dashboard = localePath(locale, "ai/dashboard");

  preconnect(CLERK_ORIGIN);
  preconnect(new URL(GATEWAY_URL).origin, { crossOrigin: "anonymous" });
  preconnect(new URL(CREDITS_URL).origin, { crossOrigin: "anonymous" });
  usePrefetchQuery(quoteOptions(DEFAULT_USD_CENTS));

  return (
    <MotionConfig reducedMotion="user">
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        routerPush={(to) => navigate(to)}
        routerReplace={(to) => navigate(to, { replace: true })}
        afterSignOutUrl={aiPage}
        // Clerk otherwise sends sign-up to its hosted page and lands both
        // flows on origyn.com; this page is the only place either happens.
        signInUrl={dashboard}
        signUpUrl={dashboard}
        signInForceRedirectUrl={dashboard}
        signUpForceRedirectUrl={dashboard}
      >
        <div className="min-h-screen bg-white font-sans text-ink">
          <meta name="theme-color" content="#ffffff" />
          <meta name="robots" content="noindex" />
          <style>{`html,body{background:#ffffff;color-scheme:light}`}</style>

          <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 md:px-16">
            <Link to={aiPage} dir="ltr" className="flex items-start">
              <img
                src="/origyn-logo-blue.webp"
                width={480}
                height={112}
                alt="Origyn"
                className="h-7 w-auto md:h-9"
              />
              <span className="ms-1 font-mono text-[10px] italic tracking-[0.08em] text-[#263C85] md:text-[12px]">
                {t("header.badge")}
              </span>
            </Link>
            {/* Docs sits on the trailing edge so the avatar appearing or
                not after sign-in never moves it. */}
            <div className="flex items-center gap-3">
              <Account />
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="-me-3 inline-flex h-9 items-center rounded-full px-3 text-[0.8125rem] font-medium text-navy transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                {t("aiDashboard.docs")}
              </a>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-6 pb-24 md:px-16">
            <Content />
          </main>
          <Toaster />
        </div>
      </ClerkProvider>
    </MotionConfig>
  );
};

export default AIDashboardPage;
