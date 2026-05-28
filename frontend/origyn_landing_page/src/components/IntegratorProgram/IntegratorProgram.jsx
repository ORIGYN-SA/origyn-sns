import React from "react";
import styles from "./IntegratorProgram.module.scss";
import Button from "@components/Button/Button";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";

const IntegratorProgram = ({ id }) => {
  const t = useT();
  const { locale } = useLocale();
  const paragraphs = t("home.integrator.description").split("\n\n");
  return (
    <section className={styles.container} id={id}>
      <div className={styles.leftPanel}>
        <div className={styles.leftPanelContent}>
          <h2 className={styles.title}>
            {t("home.integrator.titleLineOne")} <br />{" "}
            <span className={styles.program}>{t("home.integrator.titleLineTwo")}</span>
          </h2>
          <p className={styles.description}>
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
          </p>
          <Button
            url={localePath(locale, "integrator")}
            text={t("home.integrator.cta")}
            className={styles.gradientButton}
          />
        </div>
      </div>

      <div className={styles.rightPanelWrapper}>
        <img
          src="/integrator-program.jpg"
          alt={t("home.integrator.titleLineOne")}
          className={styles.rightPanelImage}
        />
      </div>
    </section>
  );
};

export default IntegratorProgram;
