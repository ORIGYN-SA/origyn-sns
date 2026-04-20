import { useState } from "react";
import PageLayout from "@components/PageLayout";
import BePart from "@components/BePart";
import Accordion from "@components/Accordion";
import styles from "./HelpCenterPage.module.scss";

const FAQS = [
  {
    icon: "/faq-ogy.svg",
    title: "The OGY Token",
    description: "Powering Web 3.0's Decentralized Asset Certification",
    answer: `The <strong>OGY token</strong> is the core utility of the ORIGYN Protocol. It connects the certification of real-world assets to decentralized blockchain infrastructure, making ownership, authentication, and content verification truly secure.<br><br>OGY enables a global system where physical assets are digitally certified, tracked, and integrated into decentralized applications and markets.`,
  },
  {
    icon: "/faq-protocol.svg",
    title: "Protocol Utility",
    description:
      "OGY is required to perform essential functions across the ORIGYN ecosystem.",
    answer: `<strong>Certification:</strong> Every asset certified on ORIGYN requires OGY to mint an immutable on-chain certificate.<br><strong>Transaction Layer:</strong> Facilitates transfers, re-certifications, and lifecycle events of certified assets.<br><strong>Data Storage:</strong> Supports secure, decentralized storage of asset metadata and provenance.<br>This utility ensures that OGY is integral to every transaction within the protocol.`,
  },
  {
    icon: "/faq-contract-address.svg",
    title: "OGY Token Contract Address",
    description:
      "The OGY Token is deployed on the Internet Computer blockchain.",
    answer: `The OGY token is deployed on the Internet Computer blockchain and operates as a native utility token within the ORIGYN Protocol.<br><br>Official Contract Address:</strong><br><strong>lkwrt-vyaaa-aaaaq-aadhq-cai</strong><br><br>Users types assets within the call<br>Always verify the contract address before engaging with OGY.<br><br><a href="https://coinmarketcap.com/currencies/origyn-foundation/#Markets" target="_blank" rel="noopener noreferrer">[BUY OGY]</a>`,
  },
  {
    icon: "/faq-governance.svg",
    title: "Governance",
    description: "OGY is a governance token empowering its holders to:",
    answer: `• Propose and vote on protocol upgrades, and liquidity rules, and ecosystem changes.<br>• Oversee the onboarding of integrators and certifiers.<br>• Allocate treasury funds toward innovation, growth, and strategic initiatives.<br><br>Governance is fully decentralized through the ORIGYN DAO, giving the community direct influence over the protocol's evolution.`,
  },
  {
    icon: "/faq-staking-rewards.svg",
    iconStyle: { marginLeft: "-6px", marginTop: "-13px" },
    title: "Staking and Rewards",
    description: "OGY staking secures the network while aligning incentives.",
    answer: `<strong>Network Security:</strong> Stakers participate in governance and help validate protocol operations.<br><br><strong>Rewards:</strong> Earn a share of protocol revenue from certification fees and network activity.<br><br><strong>Long-Term Alignment:</strong> Staking encourages long-term participation and strengthens the ecosystem.<br><br>The staking model ties token utility directly to protocol adoption and success.<br><a href="https://dashboard.origyn.com" target="_blank" rel="noopener noreferrer"><strong>[STAKE NOW]</strong></a>`,
  },
  {
    icon: "/faq-value.svg",
    title: "Deflationary Mechanics / Value Accrual",
    iconStyle: { marginLeft: "-5px", marginTop: "-7px" },

    description:
      "OGY integrates a deflationary model designed for sustainable growth.",
    answer: `<strong>Certification Burn:</strong> A portion of OGY used in certification is permanently removed from circulation.<br><br><strong>Treasury Management:</strong> Protocol revenue supports development, rewards, and token value optimization.<br><br>As protocol usage scales, OGY supply decreases, reinforcing value creation aligned with adoption.`,
  },
  {
    icon: "/faq-ogy.svg",
    title: "Tokenomics Overview",
    description: "Total Supply: 10.4 Billion OGY",
    answer: `<strong>Distribution:</strong> Allocated to ecosystem growth, staking rewards, community, and governance.<br><br><strong>Revenue Model:</strong> Protocol fees paid in OGY create ongoing demand while reducing supply through burning mechanisms.<br>The model is designed to support long-term protocol sustainability and future-focused alignment.`,
  },
  {
    icon: "/faq-future.svg",
    title: "The Future of OGY",
    description: "OGY is the foundation of a decentralized framework.",
    answer: `OGY is the foundation of a decentralized framework designed to certify, manage, and unlock the value of real-world assets on-chain. As ORIGYN grows, OGY's role expands as the economic engine driving asset certification, governance, and ecosystem development.`,
  },
  {
    icon: "/faq-explore.svg",
    title: "Explore live token",
    description:
      "Explore live token data, staking options, and governance participation in the ORIGYN Dashboard.",
    answer: `<span style="text-decoration: underline;">ORIGYN Dashboard</span>: <a href="https://dashboard.origyn.com" target="_blank" rel="noopener noreferrer"><strong>Click to access Dashboard</strong></a></span>`,
  },
];

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFAQs = FAQS.filter((faq) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = faq.title.toLowerCase().includes(query);
    const descriptionMatch = faq.description.toLowerCase().includes(query);

    return titleMatch || descriptionMatch;
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <PageLayout>
      <div className={styles.helpCenterContainer}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.mainTitle}>
              Help <br id="help-center-breaks" />
              <span>center</span>
            </h2>
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <input
                  type="text"
                  placeholder="Search.."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={styles.searchInput}
                />
                <div className={styles.searchIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <Accordion
            items={filteredFAQs}
            resetDep={searchQuery}
            className={styles.accordionContainer}
          />
        </div>
      </div>
      <BePart />
    </PageLayout>
  );
};

export default HelpCenterPage;
