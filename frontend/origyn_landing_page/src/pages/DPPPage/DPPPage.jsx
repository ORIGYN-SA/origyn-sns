import PageLayout from "@components/PageLayout";
import { useT } from "@/i18n/LocaleContext";
import styles from "./DPPPage.module.scss";

// Placeholder: content still to be written.
const DPPPage = () => {
  const t = useT();

  return (
    <PageLayout>
      <section className={styles.hero}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>{t("dpp.eyebrow")}</span>
          <h1 className={styles.title}>{t("dpp.title")}</h1>
          <p className={styles.subtitle}>{t("dpp.subtitle")}</p>
        </div>
      </section>
    </PageLayout>
  );
};

export default DPPPage;
