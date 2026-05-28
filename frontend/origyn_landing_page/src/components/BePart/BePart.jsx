import Button from "@components/Button/Button";
import { useT } from "@/i18n/LocaleContext";
import styles from "./BePart.module.scss";

const BePart = () => {
  const t = useT();
  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <h2 className={styles.titleDesktop}>
          {t("home.bePart.titleLead")}
          <br />
          <span className={styles.italic}>{t("home.bePart.emphasisDesktop")}</span>
        </h2>
        <h2 className={styles.titleMobile}>
          {t("home.bePart.titleLead")}
          <br />
          <span className={styles.italic}>
            {t("home.bePart.emphasisMobileLineOne")} <br />
            {t("home.bePart.emphasisMobileLineTwo")}
          </span>
        </h2>
        <Button
          url="https://t.me/origynfoundation"
          text={t("home.bePart.cta")}
          target="_blank"
        />
      </div>
      <div className={styles.origynWhiteLogoContainer}>
        <div className={styles.gradientBackground} />
        <img
          className={styles.origynWhiteLogo}
          src="/ogy_white.svg"
          alt="ORIGYN White Logo"
        />
      </div>
    </div>
  );
};

export default BePart;
