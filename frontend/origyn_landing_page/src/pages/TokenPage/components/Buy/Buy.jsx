import styles from "./Buy.module.scss";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";

const exchanges = [
  {
    name: "MEXC",
    logo: "/token/exchanges/mexc.svg",
    href: "https://www.mexc.com/",
  },
  {
    name: "BitMart",
    logo: "/token/exchanges/bitmart.png",
    href: "https://www.bitmart.com/",
    height: "32px",
  },
  {
    name: "LBank",
    logo: "/token/exchanges/lbank.svg",
    href: "https://www.lbank.com/",
    height: "25px",
  },
  {
    name: "ICPEx",
    logo: "/token/exchanges/icpex.png",
    href: "https://icpex.org/",
  },
  {
    name: "Bitrue",
    logo: "/token/exchanges/bitrue.png",
    href: "https://www.bitrue.com/",
    height: "33px",
  },
  {
    name: "Helix",
    logo: "/token/exchanges/helix.png",
    href: "https://helixmarkets.io/",
  },
];

const Buy = () => {
  return (
    <div className={styles.exchangeRow}>
      {exchanges.map(({ name, logo, href, height }, index) => (
        <ScrollReveal key={name} delay={index * 0.1}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.exchangeLink}
            aria-label={name}
          >
            <img src={logo} alt={name} className={styles.exchangeLogo} style={{ height }} />
          </a>
        </ScrollReveal>
      ))}
    </div>
  );
};

export default Buy;
