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
      name: "CERTIFICATES",
      url: "https://origyn.gitbook.io/origyn/use-cases/certificates-of-authenticity",
    },
    {
      name: "INTEGRATORS",
      anchorId: "integrator-program",
    },
    {
      name: "ECOSYSTEM",
      anchorId: "our-partners",
    },
    {
      name: "USE CASES",
      anchorId: "use-cases",
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
  const handleAnchorClick = (e, sectionId) => {
    if (window.location.pathname === "/") {
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
                  href={link.anchorId ? `/#${link.anchorId}` : link.url}
                  onClick={
                    link.anchorId
                      ? (e) => handleAnchorClick(e, link.anchorId)
                      : undefined
                  }
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
              <span
                className={styles.socialIcon}
                style={{ maskImage: `url(${link.icon})`, WebkitMaskImage: `url(${link.icon})` }}
              />
            </a>
          ))}
        </div>
      </div>
      <div className={styles.bottom}>©2026 All rights reserved – origyn</div>
    </>
  );
};

export default Footer;
