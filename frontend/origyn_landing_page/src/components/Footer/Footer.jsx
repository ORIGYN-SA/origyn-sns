import styles from "./Footer.module.css";
import XIcon from "../../assets/icons/x-icon.svg?react";
import TelegramIcon from "../../assets/icons/telegram-icon.svg?react";
import MediumIcon from "../../assets/icons/medium-icon.svg?react";
import LinkedInIcon from "../../assets/icons/linkedin-icon.svg?react";
const socialLinks = [
  { name: "Twitter", url: "https://x.com/origyntech", Icon: XIcon },
  {
    name: "Telegram",
    url: "https://t.me/origynfoundation",
    Icon: TelegramIcon,
  },
  { name: "Medium", url: "https://origyn.medium.com/", Icon: MediumIcon },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/origyn-foundation/",
    Icon: LinkedInIcon,
  },
];

const leftLinks = [
  [
    {
      name: "CERTIFICATES",
      url: "https://origyn.gitbook.io/origyn/use-cases/certificates-of-authenticity",
    },
    {
      name: "INTEGRATORS",
      onClick: () => {
        const element = document.getElementById("integrator-program");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
    {
      name: "ECOSYSTEM",
      onClick: () => {
        const element = document.getElementById("our-partners");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
    {
      name: "USE CASES",
      onClick: () => {
        const element = document.getElementById("use-cases");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      },
    },
  ],
  [
    {
      name: "OGY TOKEN",
      url: "https://coinmarketcap.com/currencies/origyn-foundation/",
    },
    {
      name: "DASHBOARD",
      url: "https://dashboard.origyn.com",
    },
  ],
];
const Footer = () => {
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
                  href={link.url}
                  onClick={link.onClick}
                  className={styles.link}
                >
                  {link.name}
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
              <link.Icon className={styles.socialIcon} />
            </a>
          ))}
        </div>
      </div>
      <div className={styles.bottom}>©2025 all rights reserved – origyn</div>
    </>
  );
};

export default Footer;
