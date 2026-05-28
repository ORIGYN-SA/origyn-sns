import styles from "./Hero.module.scss";
import Stats from "@components/Stats/Stats";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import GradientButton from "@components/Button/GradientButton";
import { useT } from "@/i18n/LocaleContext";


const Hero = ({ data }) => {
  const t = useT();
  const statsData = [
    { value: data?.marketCap, title: t("token.stats.marketCap") },
    { value: data?.totalBurned, title: t("token.stats.burned") },
    { value: data?.circulatingSupply, title: t("token.stats.circulating") },
    { value: data?.totalHolders, title: t("token.stats.holders") },
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroContentHeader}>
            <h1>
              <ScrollReveal>
                {t("token.hero.titleLead")} <br />
              </ScrollReveal>
              <ScrollReveal delay={0.15}>
                <i className={styles.italic}>{t("token.hero.titleEmphasis")}</i> {t("token.hero.titleSuffix")}
              </ScrollReveal>
            </h1>
          <ScrollReveal delay={0.25}>
            <p dangerouslySetInnerHTML={{ __html: t("token.hero.paragraphOne") }} />
          </ScrollReveal>
          <ScrollReveal delay={0.35}>
            <p dangerouslySetInnerHTML={{ __html: t("token.hero.paragraphTwo") }} />
          </ScrollReveal>
          <ScrollReveal delay={0.45}>
            <p dangerouslySetInnerHTML={{ __html: t("token.hero.paragraphThree") }} />
          </ScrollReveal>
          <ScrollReveal delay={0.45}>
            <GradientButton
              href="https://www.mexc.com/price/OGY"
              text={t("token.hero.cta")}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroButton}
            />
          </ScrollReveal>
        </div>
        <div className={styles.heroContentBackground}>
          <img src="/token.png" alt={t("token.hero.imageAlt")} />
        </div>
      </div>
      <div className={styles.statsContainer}>
        <Stats items={statsData} />
      </div>
    </section>
  )
}

export default Hero
