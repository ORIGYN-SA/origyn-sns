import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-charcoal text-white">
      <div className="container mx-auto grid grid-cols-1 xl:grid-cols-4 gap-10 text-center xl:text-left py-16 px-4">
        <div className="mx-auto xl:mx-0">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/ogy_logo.svg" alt="OGY Dashboard Logo" />
            <span className="self-center text-xl font-semibold whitespace-nowrap">
              OGY Dashboard
            </span>
          </Link>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">OGY Dashboard</h3>
          <ul className="grid gap-4">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/#ogy-circulation-state">Circulation</Link>
            </li>
            <li>
              <Link to="/">Governance</Link>
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
          <h3 className="text-lg font-semibold mb-3">
            Learn more about OGY Tokenomics & ORIGYN
          </h3>
          <ul className="grid gap-4">
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
          <h3 className="text-lg font-semibold mb-3">Support</h3>
          <ul className="grid gap-4">
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
              <Link to="/recovery">Recover your tokens</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
