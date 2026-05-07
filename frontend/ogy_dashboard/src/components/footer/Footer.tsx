import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import BrandLogo from "@components/brand/BrandLogo";

type ExternalLinkItem = {
  label: string;
  href: string;
};

type InternalLinkItem = {
  label: string;
  to: string;
};

const dashboardLinks: InternalLinkItem[] = [
  { label: "Home", to: "/" },
  { label: "Circulation", to: "/#ogy-circulation-state" },
  { label: "Governance", to: "/#governance-tokens-stakes" },
  { label: "Revenue", to: "/#ogy-treasury-account" },
  { label: "Rewards", to: "/#ogy-reward-account" },
  { label: "Distribution", to: "/#ogy-token-distribution" },
  { label: "OGY Governance Dashboard", to: "/governance" },
  { label: "OGY Transaction Explorer", to: "/transaction-history" },
];

const learnLinks: ExternalLinkItem[] = [
  { label: "OGY Tokenomics Deck", href: "/Tokenomics_V3.pdf" },
  {
    label: "Tokenomics Litepaper",
    href: "https://origyn.gitbook.io/origyn/other/key-documents",
  },
  {
    label: "ORIGYN NFT Standard",
    href: "https://github.com/ORIGYN-SA/origyn_nft",
  },
  {
    label: "ORIGYN Tokenomics FAQ",
    href: "https://origyn.gitbook.io/origyn/tokenomics/tokenomics-faq",
  },
  { label: "ORIGYN Website", href: "https://www.origyn.ch/" },
  { label: "ORIGYN Gitbook", href: "https://origyn.gitbook.io/origyn/" },
];

const socialLinks: ExternalLinkItem[] = [
  { label: "Twitter", href: "https://twitter.com/ORIGYNTech" },
  { label: "Telegram", href: "https://t.me/origynfoundation" },
  { label: "Medium", href: "https://medium.com/@ORIGYN-Foundation" },
  { label: "Contact", href: "https://www.origyn.com/contact/" },
];

const supportLinks: InternalLinkItem[] = [
  { label: "Contact support", to: "/support" },
  { label: "Recover your tokens", to: "/recovery" },
];

const sectionHeadingClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 mb-5";

const linkClass =
  "inline-flex items-center gap-1.5 text-[14px] font-light text-white/75 hover:text-white transition-colors duration-150";

const Footer = () => {
  return (
    <footer className="relative bg-charcoal text-white -mt-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
      />

      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-10 xl:gap-8 text-center md:text-left">
          <div className="xl:col-span-4 flex flex-col items-center md:items-start gap-4">
            <BrandLogo />
          </div>

          <div className="xl:col-span-3">
            <h3 className={sectionHeadingClass}>OGY Dashboard</h3>
            <ul className="grid gap-2.5 justify-items-center md:justify-items-start">
              {dashboardLinks.map(({ label, to }) => (
                <li key={`${label}-${to}`}>
                  <Link to={to} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="xl:col-span-3">
            <h3 className={sectionHeadingClass}>
              Learn more about OGY Tokenomics &amp; ORIGYN
            </h3>
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

          <div className="xl:col-span-2">
            <h3 className={sectionHeadingClass}>Support</h3>
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
                  <Link to={to} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 h-px bg-white/10" />

        <p className="mt-8 text-[11px] font-light leading-relaxed text-white/45 max-w-3xl text-center lg:text-left">
          *ORIGYN Foundation shall not be held liable for any loss, theft, or
          misappropriation of OGY Tokens occurring in connection with the swap
          process. Furthermore, ORIGYN Foundation shall not be held
          accountable for any failure to execute the swap if the involved
          party does not strictly adhere to the conditions specified by ORIGYN
          Foundation.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
