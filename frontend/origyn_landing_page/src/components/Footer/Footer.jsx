import { useLocation } from "react-router-dom";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";
import LanguagePicker from "@components/LanguagePicker";
import styles from "./Footer.module.scss";

const socialLinks = [
  { name: "Twitter", url: "https://x.com/origyntech", icon: "/icons/x-icon.svg" },
  { name: "Telegram", url: "https://t.me/origynfoundation", icon: "/icons/telegram-icon.svg" },
  { name: "Medium", url: "https://origyn.medium.com/", icon: "/icons/medium-icon.svg" },
  { name: "LinkedIn", url: "https://www.linkedin.com/company/origyn-foundation/", icon: "/icons/linkedin-icon.svg" },
];

const leftLinks = [
  [
    {
      labelKey: "footer.certificates",
      url: "https://origyn.gitbook.io/origyn/use-cases/certificates-of-authenticity",
    },
    {
      labelKey: "footer.integrators",
      anchorId: "integrator-program",
    },
    {
      labelKey: "footer.ecosystem",
      anchorId: "our-partners",
    },
    {
      labelKey: "footer.useCases",
      anchorId: "use-cases",
    },
  ],
  [
    {
      labelKey: "footer.ogyToken",
      url: "https://coinmarketcap.com/currencies/origyn-foundation/",
    },
    {
      labelKey: "footer.dashboard",
      url: "https://dashboard.origyn.com",
    },
  ],
];

const Footer = () => {
  const { locale } = useLocale();
  const t = useT();
  const location = useLocation();
  const rest = location.pathname.replace(/^\/[^/]+\/?/, "");
  const isHome = rest === "";

  const handleAnchorClick = (e, sectionId) => {
    if (isHome) {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.left}>
          <img
            className={styles.logo}
            src="/origyn-logo-black.png"
            alt="origyn logo"
          />
        </div>
        <div className={styles.center}>
          {leftLinks.map((group, i) => (
            <div key={i} className={styles.linkGroup}>
              {group.map((link, j) => (
                <a
                  key={j}
                  href={
                    link.anchorId
                      ? `${localePath(locale, "")}#${link.anchorId}`
                      : link.url
                  }
                  onClick={
                    link.anchorId
                      ? (e) => handleAnchorClick(e, link.anchorId)
                      : undefined
                  }
                  className={styles.link}
                >
                  {t(link.labelKey)}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.right}>
          {socialLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label={link.name}
            >
              <span
                className={styles.socialIcon}
                style={{ maskImage: `url(${link.icon})`, WebkitMaskImage: `url(${link.icon})` }}
              />
            </a>
          ))}
        </div>
      </div>
      <div className={styles.bottom}>
        <span className={styles.copyright}>{t("footer.copyright")}</span>
        <LanguagePicker className={styles.picker} />
      </div>
    </>
  );
};

export default Footer;
