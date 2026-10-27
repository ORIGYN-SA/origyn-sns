import { useState } from "react";
import Button from "@components/Button";
import { useT } from "@/i18n/LocaleContext";
import styles from "./OurIntegrators.module.scss";

const INTEGRATORS = [
  {
    id: "geoforensic",
    href: "https://geoforensic.ch/",
    icon: "/integrators/icon-pickaxe.svg",
    logo: { src: "/integrators/logo-geoforensic.webp", width: 170, mobileWidth: 120 },
    mockup: { src: "/integrators/mock-geoforensic.webp", width: 280, effect: "glow" },
    background:
      'linear-gradient(90deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.6) 55%, rgba(0, 0, 0, 0.25) 100%), url("/integrators/bg-geoforensic.webp")',
    stackedBackground:
      'linear-gradient(rgba(0, 0, 0, 0.74), rgba(0, 0, 0, 0.74)), url("/integrators/bg-geoforensic.webp")',
  },
  {
    id: "bity",
    href: "https://bity.com/en/tokenization/",
    icon: "/integrators/icon-gold.svg",
    logo: { src: "/integrators/logo-bity.svg", width: 96, mobileWidth: 68 },
    caption: { src: "/integrators/logo-bity-caption.svg", width: 80, mobileWidth: 58 },
    mockup: { src: "/integrators/mock-bity.webp", width: 240 },
    background: "linear-gradient(180deg, #3a361e 0%, #000 60%)",
  },
  {
    id: "cyber",
    href: "https://cyberorigin.ch/",
    icon: "/integrators/icon-diamond.svg",
    logo: { src: "/integrators/logo-cyberorigin.webp", width: 180, mobileWidth: 128 },
    mockup: { src: "/integrators/mock-cyber.webp", width: 270, effect: "glow" },
    background:
      'linear-gradient(rgba(0, 0, 0, 0.79), rgba(0, 0, 0, 0.79)), url("/integrators/bg-cyber.webp")',
  },
  {
    id: "12h30",
    href: "https://www.12h30.ch/",
    icon: "/integrators/icon-watch.svg",
    logo: { src: "/integrators/logo-12h30.webp", width: 168, mobileWidth: 116 },
    mockup: { src: "/integrators/mock-12h30.webp", width: 460, effect: "shadow" },
    background: 'url("/integrators/bg-12h30.webp")',
  },
];

const sizeVars = ({ width, mobileWidth }) => ({
  "--width": `${width}px`,
  "--mobile-width": `${mobileWidth}px`,
});

const OurIntegrators = () => {
  const t = useT();
  const copy = t.raw("integratorPage.integrators.items") ?? {};
  const integrators = INTEGRATORS.map((integrator) => ({
    ...integrator,
    ...copy[integrator.id],
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
            <span className={styles.cardLogo}>
              <img src={logo.src} alt={name} style={sizeVars(logo)} />
              {caption && <img src={caption.src} alt="" style={sizeVars(caption)} />}
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
          className={styles.dialog}
          style={{
            "--background": selected.background,
            "--stacked-background": selected.stackedBackground,
          }}
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
            <img
              src={selected.mockup.src}
              alt=""
              className={`${styles.mockup} ${styles[selected.mockup.effect] ?? ""}`}
              style={{ "--width": `${selected.mockup.width}px` }}
            />
          </div>
        </dialog>
      )}
    </section>
  );
};

export default OurIntegrators;
