import UtilityCard from "../UtilityCard/UtilityCard";
import styles from "./Utility.module.scss";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";

const Utility = () => {
  const utilityCards = [
    {
      title: "Certification",
      description: "Every asset certified on ORIGYN requires OGY to mint an immutable on-chain certificate.",
      icon: "/token/certification.png",
    },
    {
      title: "Transaction Layer",
      description: "Facilitates transfers, re-certifications, and lifecycle events of certified assets.",
      icon: "/token/transaction.png",
    },
    {
      title: "Data Storage",
      description: "Supports secure, decentralized storage of asset metadata and provenance.",
      icon: "/token/data.png",
    },
  ];

  return (
    <section className={styles.utility}>
      <ScrollReveal>
        <h1>
          Protocol <i>Utility</i>
        </h1>
      </ScrollReveal>
      <ScrollReveal delay={0.15}>
        <p>
          OGY is required to perform essential functions across the ORIGYN ecosystem:
        </p>
      </ScrollReveal>
      <div className={styles.cards}>
        {utilityCards.map((card, index) => (
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
