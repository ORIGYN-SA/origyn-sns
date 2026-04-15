import { Link } from "react-router-dom";
import BrandLogo from "@components/brand/BrandLogo";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-charcoal via-[#2F2F2D] via-40% to-[#2F2F2D] text-white -mt-4">
      <div className="max-w-[1440px] mx-auto py-16 px-4">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 text-center xl:text-left">
          <div className="mx-auto xl:mx-0">
            <BrandLogo />
          </div>
          <div>
            <h3 className="text-[16px] font-bold leading-none mb-3">OGY Dashboard</h3>
            <ul className="grid gap-[2px] text-[13px] font-light [&_a:hover]:underline">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/#ogy-circulation-state">Circulation</Link>
              </li>
              <li>
                <Link to="/#governance-tokens-stakes">Governance</Link>
              </li>
              <li>
                <Link to="/#ogy-treasury-account">Revenue</Link>
              </li>
              <li>
                <Link to="/#ogy-reward-account">Rewards</Link>
              </li>
              <li>
                <Link to="/#ogy-token-distribution">Distribution</Link>
              </li>
              <li>
                <Link to="/governance">OGY Governance Dashboard</Link>
              </li>
              <li>
                <Link to="/explorer">OGY Transaction Explorer</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[16px] font-bold leading-none mb-3">
              Learn more about OGY Tokenomics & ORIGYN
            </h3>
            <ul className="grid gap-[2px] text-[13px] font-light [&_a:hover]:underline">
              <li>
                <a
                  href="/Tokenomics_V3.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OGY Tokenomics Deck
                </a>
              </li>
              <li>
                <a
                  href="https://origyn.gitbook.io/origyn/other/key-documents"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tokenomics Litepaper
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ORIGYN-SA/origyn_nft"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ORIGYN NFT Standard
                </a>
              </li>
              <li>
                <a
                  href="https://origyn.gitbook.io/origyn/tokenomics/tokenomics-faq"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ORIGYN Tokenomics FAQ
                </a>
              </li>
              <li>
                <a
                  href="https://www.origyn.ch/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ORIGYN Website
                </a>
              </li>
              <li>
                <a
                  href="https://origyn.gitbook.io/origyn/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ORIGYN Gitbook
                </a>
              </li>
            </ul>
          </div>
          <div className="justify-self-center">
            <h3 className="text-[16px] font-bold leading-none mb-3">Support</h3>
            <ul className="grid gap-[2px] text-[13px] font-light [&_a:hover]:underline">
              <li>
                <a
                  href="https://twitter.com/ORIGYNTech"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/origynfoundation"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href="https://medium.com/@ORIGYN-Foundation"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Medium
                </a>
              </li>
              <li>
                <a
                  href="https://www.origyn.com/contact/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link to="/support">Contact support</Link>
              </li>
              <li>
                <Link to="/recovery">Recover your tokens</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl bg-[#222526] mt-10 py-4 px-10 text-[#E1E1E1] text-[10px] font-light leading-none text-center">
          *ORIGYN Foundation shall not be held liable for any loss, theft, or
          misappropriation of OGY Tokens occurring in connection with the swap
          process.
          <br />
          Furthermore, ORIGYN Foundation shall not be held accountable for any
          failure to execute the swap if the involved party does not strictly
          adhere to the conditions specified by ORIGYN Foundation.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
