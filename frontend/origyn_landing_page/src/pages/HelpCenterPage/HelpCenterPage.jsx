import { useState } from "react";
import PageLayout from "@components/PageLayout";
import BePart from "@components/BePart";
import Accordion from "@components/Accordion";
import { useT } from "@/i18n/LocaleContext";
import styles from "./HelpCenterPage.module.scss";

// Static visual metadata for each FAQ. Aligned by index with helpCenter.faqs
// in the i18n catalog.
const FAQ_VISUALS = [
  { icon: "/faq-ogy.svg" },
  { icon: "/faq-protocol.svg" },
  { icon: "/faq-contract-address.svg" },
  { icon: "/faq-governance.svg" },
  {
    icon: "/faq-staking-rewards.svg",
    iconStyle: { marginLeft: "-6px", marginTop: "-13px" },
  },
  {
    icon: "/faq-value.svg",
    iconStyle: { marginLeft: "-5px", marginTop: "-7px" },
  },
  { icon: "/faq-ogy.svg" },
  { icon: "/faq-future.svg" },
  { icon: "/faq-explore.svg" },
];

const HelpCenterPage = () => {
  const t = useT();
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = (t.raw("helpCenter.faqs") ?? []).map((faq, i) => ({
    ...FAQ_VISUALS[i],
    ...faq,
  }));

  const filteredFAQs = faqs.filter((faq) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      faq.title.toLowerCase().includes(query) ||
      faq.description.toLowerCase().includes(query)
    );
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
              {t("helpCenter.titlePrefix")} <br id="help-center-breaks" />
              <span>{t("helpCenter.titleSuffix")}</span>
            </h2>
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <input
                  type="text"
                  placeholder={t("helpCenter.searchPlaceholder")}
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
