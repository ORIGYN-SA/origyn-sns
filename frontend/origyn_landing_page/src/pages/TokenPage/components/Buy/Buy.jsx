import styles from "./Buy.module.scss";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";

const exchanges = [
  {
    name: "MEXC",
    logo: "/token/exchanges/mexc.svg",
    href: "https://www.mexc.com/price/OGY",
  },
  {
    name: "BitMart",
    logo: "/token/exchanges/bitmart.png",
    href: "https://www.bitmart.com/en-US/trade/OGY_USDT",
    height: "32px",
  },
  {
    name: "LBank",
    logo: "/token/exchanges/lbank.svg",
    href: "https://www.lbank.com/trade/ogy_usdt",
    height: "25px",
  },
  {
    name: "ICPEx",
    logo: "/token/exchanges/icpex.png",
    href: "https://next.icpex.org/explore/lkwrt-vyaaa-aaaaq-aadhq-cai",
  },
  {
    name: "Bitrue",
    logo: "/token/exchanges/bitrue.png",
    href: "https://www.bitrue.com/trade/ogy_usdt",
    height: "33px",
  }
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
