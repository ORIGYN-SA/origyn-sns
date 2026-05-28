import React from "react";
import { Calculator } from "@origyn/shared/calculator";
import styles from "./CertifyYourAssets.module.scss";
import Button from "@components/Button/Button";
import { useT } from "@/i18n/LocaleContext";

const CertifyYourAssets = ({ id }) => {
  const t = useT();
  return (
    <div id={id} className={styles.container}>
      <div className={styles.titleDesktop}>
        {t("home.certify.titleLine")} <br />
        <span className={styles.italic}>{t("home.certify.titleEmphasis")}</span>
      </div>
      <div className={styles.titleMobile}>
        {t("home.certify.titleLine")} <br />
        <span className={styles.italic}>{t("home.certify.titleEmphasis")}</span>
      </div>

      <span className={styles.subtitle}>{t("home.certify.subtitle")}</span>

      <div className={styles.calculatorWrapper}>
        <div className={styles.gradientBackground} />
        <div className={styles.calculatorInner}>
          <Calculator showHeader={false} />
          <div className={styles.contactBox}>
            <div className={styles.contactText}>{t("home.certify.contactPrompt")}</div>
            <Button text={t("home.certify.contactCta")} url="mailto:techsupport@origyn.com" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertifyYourAssets;
