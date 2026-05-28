import React from "react";
import styles from "./WhyOrigyn.module.scss";
import Benefits from "@components/Benefits/Benefits";
import { useT } from "@/i18n/LocaleContext";

const WhyOrigyn = () => {
  const t = useT();
  const paragraphs = t("home.whyOrigyn.body").split("\n\n");
  return (
    <div className={styles.container}>
      <div className={styles.titleWithContent}>
        <div className={styles.title}>
          <span className={styles.why}>
            {t("home.whyOrigyn.titleLineOne")} <br />
            {t("home.whyOrigyn.titleLineTwo")}
          </span>
        </div>
        <div className={styles.subtitle}>{t("home.whyOrigyn.subtitle")}</div>
        <div className={styles.content}>
          {paragraphs.map((para, i) => (
            <React.Fragment key={i}>
              {para}
              {i < paragraphs.length - 1 && (
                <>
                  <br />
                  <br />
                </>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      <Benefits />
    </div>
  );
};

export default WhyOrigyn;
