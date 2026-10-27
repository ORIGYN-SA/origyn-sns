import { useState } from "react";
import Button from "@components/Button";
import { useT } from "@/i18n/LocaleContext";
import styles from "./OurIntegrators.module.scss";

// Visuals and links stay in code; text comes from the catalog and is zipped in by index.
const INTEGRATOR_VISUALS = [
  {
    id: "geoforensic",
    icon: "/integrators/icon-gold.svg",
    logo: "/integrators/logo-geoforensic.webp",
    mockup: "/integrators/mock-geoforensic.webp",
    href: "https://geoforensic.ch/",
  },
  {
    id: "bity",
    icon: "/integrators/icon-gold.svg",
    logo: "/integrators/logo-bity.svg",
    caption: "/integrators/logo-bity-caption.svg",
    mockup: "/integrators/mock-bity.webp",
    href: "https://bity.com/en/tokenization/",
  },
  {
    id: "cyber",
    icon: "/integrators/icon-diamond.svg",
    logo: "/integrators/logo-cyberorigin.webp",
    mockup: "/integrators/mock-cyber.webp",
    href: "https://cyberorigin.ch/",
  },
  {
    id: "12h30",
    icon: "/integrators/icon-bag.svg",
    logo: "/integrators/logo-12h30.webp",
    mockup: "/integrators/mock-12h30.webp",
    href: "https://www.12h30.ch/",
  },
];

const OurIntegrators = () => {
  const t = useT();
  const itemsText = t.raw("integratorPage.integrators.items") ?? [];
  const integrators = INTEGRATOR_VISUALS.map((v, i) => ({
    ...v,
    ...(itemsText[i] ?? {}),
  }));

  const [selectedId, setSelectedId] = useState(null);
  const selected = integrators.find((item) => item.id === selectedId);

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        {t("integratorPage.integrators.titleLineOne")}
        <br />
        <span>{t("integratorPage.integrators.titleLineTwo")}</span>
      </h2>
      <p className={styles.subtitle}>{t("integratorPage.integrators.subtitle")}</p>

      <div className={styles.grid}>
        {integrators.map(({ id, icon, logo, caption, name }) => (
          <button
            key={id}
            type="button"
            className={styles.card}
            onClick={() => setSelectedId(id)}
            aria-haspopup="dialog"
          >
            <span className={styles.cardIcon}>
              <img src={icon} alt="" />
            </span>
            <span className={`${styles.cardLogo} ${styles[`logo-${id}`]}`}>
              <img src={logo} alt={name} />
              {caption && <img src={caption} alt="" className={styles.caption} />}
            </span>
            <span className={styles.cardCta}>
              <svg viewBox="0 0 8 8" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M0 4h8M4 0v8" />
              </svg>
              {t("integratorPage.integrators.discover")}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <dialog
          ref={(node) => {
            if (node && !node.open) node.showModal();
          }}
          className={`${styles.dialog} ${styles[`theme-${selected.id}`]}`}
          aria-labelledby="integrator-dialog-title"
          onClose={() => setSelectedId(null)}
          onClick={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.close();
          }}
        >
          <form method="dialog">
            <button
              className={styles.close}
              aria-label={t("integratorPage.integrators.close")}
            >
              <img src="/integrators/icon-close.svg" alt="" />
            </button>
          </form>
          <div className={styles.dialogBody}>
            <div className={styles.dialogContent}>
              <h3 id="integrator-dialog-title" className={styles.dialogTitle}>
                {selected.title}
              </h3>
              <p className={styles.dialogTagline}>{selected.tagline}</p>
              <div
                className={styles.dialogText}
                dangerouslySetInnerHTML={{ __html: selected.description ?? "" }}
              />
              <Button url={selected.href} text={selected.cta} className={styles.dialogCta} />
            </div>
            <img src={selected.mockup} alt="" className={styles.mockup} />
          </div>
        </dialog>
      )}
    </section>
  );
};

export default OurIntegrators;
