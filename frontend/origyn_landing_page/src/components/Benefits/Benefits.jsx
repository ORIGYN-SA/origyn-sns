import React from "react";
import styles from "./Benefits.module.css";
import BenefitCpu from "../../assets/icons/benefit_cpu.svg";
import BenefitToken from "../../assets/icons/benefit_ogy.svg";
import BenefitMultiAsset from "../../assets/icons/benefit_multi-asset.svg";
import BenefitSecurity from "../../assets/icons/benefit_security.svg";

const benefitsData = [
  {
    title: "100% On-Chain Certification",
    description: "No intermediaries, no tampering. Fully decentralized.",
    icon: BenefitCpu,
  },
  {
    title: "$OGY Token Utility",
    description:
      "Powering the ORIGYN ecosystem through governance and protocol utility.",
    icon: BenefitToken,
  },
  {
    title: "Multi-Asset Support",
    description: "Certify art, luxury goods, gold, real estate, and more.",
    icon: BenefitMultiAsset,
  },
  {
    title: "Industry-Leading Security",
    description:
      "Immutable blockchain protection for your most valuable assets.",
    icon: BenefitSecurity,
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
