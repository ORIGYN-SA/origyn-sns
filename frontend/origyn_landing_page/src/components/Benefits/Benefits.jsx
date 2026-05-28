import React from "react";
import styles from "./Benefits.module.scss";
import { useT } from "@/i18n/LocaleContext";

const ICONS = [
  "/icons/benefit_cpu.svg",
  "/icons/benefit_ogy.svg",
  "/icons/benefit_multi-asset.svg",
  "/icons/benefit_security.svg",
];

const Benefits = () => {
  const t = useT();
  const items = t.raw("home.benefits.items") ?? [];
  return (
    <div className={styles.benefitsContainer}>
      {items.map((benefit, index) => (
        <div key={index} className={styles.benefitItem}>
          <div className={styles.iconContainer}>
            <img src={ICONS[index]} alt={benefit.title} />
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
