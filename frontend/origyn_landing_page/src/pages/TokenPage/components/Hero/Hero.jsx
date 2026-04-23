import styles from "./Hero.module.scss";
import Stats from "@components/Stats/Stats";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import GradientButton from "@components/Button/GradientButton";


const Hero = ({ data }) => {
    const statsData = [
    {
      value: data?.marketCap,
      title: "$OGY Market Cap",
    },
    {
      value: data?.totalBurned,
      title: "Total OGY burned",
    },
    {
      value: data?.circulatingSupply,
      title: "Circulating supply",
    },
    {
      value: data?.totalHolders,
      title: "Token holders",
    },
  ]

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroContentHeader}>
            <h1>
              <ScrollReveal>
                The <br />
              </ScrollReveal>
              <ScrollReveal delay={0.15}>
                <i className={styles.italic}>OGY</i> TOKEN
              </ScrollReveal>
            </h1>
          <ScrollReveal delay={0.25}>
            <p>
              The OGY token is the <b>core utility</b> of the ORIGYN Protocol.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.35}>
            <p>
              It <b>connects</b> the certification of real-world assets to decentralized blockchain infrastructure, <b>making ownership, authentication,</b> and <b>transfer verifiable and secure.</b>
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.45}>
            <p>
              OGY enables a global system where <b>physical</b> assets are <b>digitally certified, tracked,</b> and <b>integrated into decentralized</b> applications and markets.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.45}>
            <GradientButton
              href="https://www.mexc.com/price/OGY"
              text="Buy OGY"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroButton}
            />
          </ScrollReveal>
        </div>
        <div className={styles.heroContentBackground}>
          <img src="/token.png" alt="OGY token" />
        </div>
      </div>
      <div className={styles.statsContainer}>
        <Stats items={statsData} />
      </div>
    </section>
  )
}

export default Hero