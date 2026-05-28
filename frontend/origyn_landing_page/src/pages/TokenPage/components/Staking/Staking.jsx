import UtilityCard from "../UtilityCard/UtilityCard";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import GradientButton from "@components/Button/GradientButton";
import { useT } from "@/i18n/LocaleContext";
import styles from "./Staking.module.scss";

const ICONS = [
  "/token/security.png",
  "/token/rewards.png",
  "/token/alignement.png",
];

const Staking = () => {
  const t = useT();
  const stakingCards = (t.raw("token.staking.cards") ?? []).map((card, i) => ({
    ...card,
    icon: ICONS[i],
  }));

  return (
    <section className={styles.staking}>
      <ScrollReveal>
        <h1>{t("token.staking.titleLineOne")}</h1>
      </ScrollReveal>
      <ScrollReveal delay={0.15}>
        <h1>
          {t("token.staking.titleLineTwoPrefix")}<i> {t("token.staking.titleLineTwoEmphasis")}</i>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={0.25}>
        <p>{t("token.staking.lead")}</p>
      </ScrollReveal>
      <div className={styles.cards}>
        {stakingCards.map((card, index) => (
          <ScrollReveal key={card.title} delay={0.15 * (index + 1)}>
            <UtilityCard
              isStaking
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
            />
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal delay={0.35}>
        <p>{t("token.staking.closing")}</p>
      </ScrollReveal>
      <ScrollReveal delay={0.45}>
        <GradientButton
          href="https://nns.ic0.app/neurons/?u=leu43-oiaaa-aaaaq-aadgq-cai "
          text={t("token.staking.cta")}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaButton}
        />
      </ScrollReveal>
    </section>
  );
};

export default Staking;
