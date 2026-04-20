import React from "react";
import styles from "./Benefits.module.scss";

const benefitsData = [
  {
    title: "100% On-Chain Certification",
    description: "No intermediaries, no tampering. Fully decentralized.",
    icon: "/icons/benefit_cpu.svg",
  },
  {
    title: "$OGY Token Utility",
    description:
      "Powering the ORIGYN ecosystem through governance and protocol utility.",
    icon: "/icons/benefit_ogy.svg",
  },
  {
    title: "Multi-Asset Support",
    description: "Certify art, luxury goods, gold, real estate, and more.",
    icon: "/icons/benefit_multi-asset.svg",
  },
  {
    title: "Industry-Leading Security",
    description:
      "Immutable blockchain protection for your most valuable assets.",
    icon: "/icons/benefit_security.svg",
  },
];

const Benefits = () => {
  return (
    <div className={styles.benefitsContainer}>
      {benefitsData.map((benefit, index) => (
        <div key={index} className={styles.benefitItem}>
          <div className={styles.iconContainer}>
            <img src={benefit.icon} alt={benefit.title} />
          </div>
          <div className={styles.contentContainer}>
            <div className={styles.title}>{benefit.title}</div>
            <div className={styles.description}>{benefit.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Benefits;
