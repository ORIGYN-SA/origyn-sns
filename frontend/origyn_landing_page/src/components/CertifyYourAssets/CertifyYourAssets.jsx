import React from "react";
import { Calculator } from "@origyn/shared/calculator";
import styles from "./CertifyYourAssets.module.scss";
import Button from "@components/Button/Button";

const CertifyYourAssets = ({ id }) => {
  return (
    <div id={id} className={styles.container}>
      <div className={styles.titleDesktop}>
        Certify <br />
        <span className={styles.italic}>your assets</span>
      </div>
      <div className={styles.titleMobile}>
        Certify your <br />
        <span className={styles.italic}>assets</span>
      </div>

      <span className={styles.subtitle}>
        Use the ORIGYN Certification Calculator to instantly estimate the costs
        of securing your assets with fully on-chain digital certificates.
        Whether you're certifying fine art, luxury goods, gold, or other
        valuable assets, this tool gives you a clear picture of infrastructure
        and technology costs with no guesswork.
      </span>

      <div className={styles.calculatorWrapper}>
        <div className={styles.gradientBackground} />
        <div className={styles.calculatorInner}>
          <Calculator showHeader={false} />
          <div className={styles.contactBoxAbsolute}>
            <div className={styles.contactText}>
              To certify your assets get in touch with us:
            </div>
            <Button text="Contact ORIGYN" url="mailto:techsupport@origyn.com" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertifyYourAssets;
