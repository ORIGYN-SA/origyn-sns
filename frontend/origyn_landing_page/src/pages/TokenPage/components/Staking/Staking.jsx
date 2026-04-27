import UtilityCard from "../UtilityCard/UtilityCard";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import GradientButton from "@components/Button/GradientButton";
import styles from "./Staking.module.scss";

const Staking = () => {
  const stakingCards = [
    {
      title: "Network Security",
      description: "Stakers participate in governance and help validate protocol operations.",
      icon: "/token/security.png",
    },
    {
      title: "Rewards",
      description: "Earn a share of protocol revenue from certification fees and network activity.",
      icon: "/token/rewards.png",
    },
    {
      title: "Long-Term Alignment",
      description: "Staking encourages long-term participation and strengthens the ecosystem.",
      icon: "/token/alignement.png",
    },
  ];

  return (
    <section className={styles.staking}>
      <ScrollReveal>
        <h1>
          Staking
        </h1>
      </ScrollReveal>
      <ScrollReveal delay={0.15}>
        <h1>
          and<i> Rewards</i>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={0.25}>
        <p>
          OGY staking secures the network while aligning incentives :
        </p>
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
        <p>
          The staking model ties token utility directly to protocol adoption and success.
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.45}>
        <GradientButton
          href="https://nns.ic0.app/neurons/?u=leu43-oiaaa-aaaaq-aadgq-cai "
          text="STAKE NOW"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaButton}
        />
      </ScrollReveal>
    </section>
  );
};

export default Staking;
