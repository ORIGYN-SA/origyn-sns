import UtilityCard from "../UtilityCard/UtilityCard";
import styles from "./Utility.module.scss";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import { useT } from "@/i18n/LocaleContext";

const ICONS = [
  "/token/certification.png",
  "/token/transaction.png",
  "/token/data.png",
];

const Utility = () => {
  const t = useT();
  const cards = (t.raw("token.utility.cards") ?? []).map((card, i) => ({
    ...card,
    icon: ICONS[i],
  }));

  return (
    <section className={styles.utility}>
      <ScrollReveal>
        <h1>
          {t("token.utility.titlePrefix")} <i>{t("token.utility.titleEmphasis")}</i>
        </h1>
      </ScrollReveal>
      <ScrollReveal delay={0.15}>
        <p>{t("token.utility.lead")}</p>
      </ScrollReveal>
      <div className={styles.cards}>
        {cards.map((card, index) => (
          <ScrollReveal key={card.title} delay={0.15 * (index + 1)}>
            <UtilityCard
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
            />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};

export default Utility;
