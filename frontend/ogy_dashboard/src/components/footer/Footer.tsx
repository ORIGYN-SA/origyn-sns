import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import BrandLogo from "@components/brand/BrandLogo";
import LanguagePicker from "@components/LanguagePicker";
import { useLocale, useT, useLocalePath } from "@i18n/LocaleContext";

type ExternalLinkItem = {
  label: string;
  href: string;
};

type InternalLinkItem = {
  label: string;
  to: string;
};

const sectionHeadingClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 mb-5";

const linkClass =
  "inline-flex items-center gap-1.5 text-[14px] font-light text-white/75 hover:text-white transition-colors duration-150";

const Footer = () => {
  const { dir } = useLocale();
  const t = useT();
  const lp = useLocalePath();

  const dashboardLinks: InternalLinkItem[] = [
    { label: t("footer.dashboard.home"), to: "/" },
    { label: t("footer.dashboard.circulation"), to: "/#ogy-circulation-state" },
    {
      label: t("footer.dashboard.governance"),
      to: "/#governance-tokens-stakes",
    },
    { label: t("footer.dashboard.revenue"), to: "/#ogy-treasury-account" },
    { label: t("footer.dashboard.rewards"), to: "/#ogy-reward-account" },
    {
      label: t("footer.dashboard.distribution"),
      to: "/#ogy-token-distribution",
    },
    { label: t("footer.dashboard.governanceDashboard"), to: "/governance" },
    {
      label: t("footer.dashboard.transactionExplorer"),
      to: "/transaction-history",
    },
  ];

  const learnLinks: ExternalLinkItem[] = [
    { label: t("footer.learn.tokenomicsDeck"), href: "/Tokenomics_V3.pdf" },
    {
      label: t("footer.learn.litepaper"),
      href: "https://origyn.gitbook.io/origyn/other/key-documents",
    },
    {
      label: t("footer.learn.nftStandard"),
      href: "https://github.com/ORIGYN-SA/origyn_nft",
    },
    {
      label: t("footer.learn.tokenomicsFaq"),
      href: "https://origyn.gitbook.io/origyn/tokenomics/tokenomics-faq",
    },
    { label: t("footer.learn.website"), href: "https://www.origyn.ch/" },
    {
      label: t("footer.learn.gitbook"),
      href: "https://origyn.gitbook.io/origyn/",
    },
  ];

  const socialLinks: ExternalLinkItem[] = [
    {
      label: t("footer.social.twitter"),
      href: "https://twitter.com/ORIGYNTech",
    },
    {
      label: t("footer.social.telegram"),
      href: "https://t.me/origynfoundation",
    },
    {
      label: t("footer.social.medium"),
      href: "https://medium.com/@ORIGYN-Foundation",
    },
    {
      label: t("footer.social.contact"),
      href: "https://www.origyn.com/contact/",
    },
  ];

  const supportLinks: InternalLinkItem[] = [
    { label: t("footer.support.contactSupport"), to: "/support" },
    { label: t("footer.support.recoverTokens"), to: "/recovery" },
  ];

  return (
    <footer className="relative bg-charcoal text-white -mt-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
      />

      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 pt-20 pb-10">
        <div
          dir="ltr"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-10 xl:gap-8 text-center md:text-start"
        >
          <div className="xl:col-span-4 flex flex-col items-center md:items-start gap-4">
            <BrandLogo />
            <div dir={dir}>
              <LanguagePicker />
            </div>
          </div>

          <div dir={dir} className="xl:col-span-3">
            <h3 className={sectionHeadingClass}>
              {t("footer.dashboard.heading")}
            </h3>
            <ul className="grid gap-2.5 justify-items-center md:justify-items-start">
              {dashboardLinks.map(({ label, to }) => (
                <li key={`${label}-${to}`}>
                  <Link to={lp(to)} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div dir={dir} className="xl:col-span-3">
            <h3 className={sectionHeadingClass}>{t("footer.learn.heading")}</h3>
            <ul className="grid gap-2.5 justify-items-center md:justify-items-start">
              {learnLinks.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {label}
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div dir={dir} className="xl:col-span-2">
            <h3 className={sectionHeadingClass}>
              {t("footer.social.heading")}
            </h3>
            <ul className="grid gap-2.5 justify-items-center md:justify-items-start">
              {socialLinks.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {label}
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 opacity-60" />
                  </a>
                </li>
              ))}
              {supportLinks.map(({ label, to }) => (
                <li key={to}>
                  <Link to={lp(to)} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 h-px bg-white/10" />

        <p className="mt-8 text-[11px] font-light leading-relaxed text-white/45 max-w-3xl text-center lg:text-start">
          {t("footer.disclaimer")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
