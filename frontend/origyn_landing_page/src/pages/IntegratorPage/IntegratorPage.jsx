import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import PageLayout from "@components/PageLayout";
import Button from "@components/Button";
import GlassSurface from "@components/GlassSurface";
import { useLocale, useT } from "@/i18n/LocaleContext";
import { localePath } from "@/i18n/paths";
import styles from "./IntegratorPage.module.scss";

// Visuals stay in code; text comes from the catalog and is zipped in by index.
const PROGRAM_VISUALS = [
  { bg: "/integrator-program/what.webp", brightness: 1.15 },
  { bg: "/integrator-program/who.webp" },
  { bg: "/integrator-program/how.webp", brightness: 0.6 },
];

const WORKFLOW_VISUALS = [
  { step: "01", icon: "/app-workflow/whitepaper.svg" },
  { step: "02", icon: "/app-workflow/verification.svg" },
  { step: "03", icon: "/app-workflow/ogy.svg" },
  { step: "04", icon: "/app-workflow/governance.svg" },
  { step: "05", icon: "/app-workflow/performance.svg" },
];

const IntegratorPage = () => {
  const t = useT();
  const { locale } = useLocale();
  const joinHref = localePath(locale, "integrator/join");

  const programText = t.raw("integratorPage.program.steps") ?? [];
  const workflowText = t.raw("integratorPage.workflow.steps") ?? [];

  const programSteps = PROGRAM_VISUALS.map((v, i) => ({
    ...v,
    ...(programText[i] ?? {}),
  }));
  const workflowSteps = WORKFLOW_VISUALS.map((v, i) => ({
    ...v,
    ...(workflowText[i] ?? {}),
  }));

  const [currentProgramStep, setCurrentProgramStep] = useState(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const nextProgramStep = () => {
    setCurrentProgramStep((prev) =>
      prev < programSteps.length - 1 ? prev + 1 : 0,
    );
  };

  const prevProgramStep = () => {
    setCurrentProgramStep((prev) =>
      prev > 0 ? prev - 1 : programSteps.length - 1,
    );
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      e.preventDefault();
      if (distance > 0) {
        nextProgramStep();
      } else {
        prevProgramStep();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const goToTemplate = t("integratorPage.program.goToStep");
  const currentProgram = programSteps[currentProgramStep] ?? {};
  const activeWorkflow = workflowSteps[activeWorkflowStep ?? 0] ?? {};

  return (
    <div className={styles.page}>
      <PageLayout>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {t("integratorPage.hero.titleLead")}
            <br />
            {t("integratorPage.hero.titleConnector")}{" "}
            <span>{t("integratorPage.hero.titleEmphasis")}</span>
          </h1>
          <p className={styles.heroSubtitle}>
            {t("integratorPage.hero.subtitle")}
          </p>
          <Button url={joinHref} text={t("integratorPage.hero.cta")} />
        </div>
      </section>

      {/* Integrator Program Section - HowItWorks style */}
      <section
        className={styles.programSection}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.programLeft}>
          <div className={styles.programLeftContent}>
            <div>
              <h2 className={styles.programTitle}>
                {t("integratorPage.program.titleLineOne")}
                <br />
                <span>{t("integratorPage.program.titleLineTwo")}</span>
              </h2>
              <p className={styles.programLabel}>
                {currentProgram.labelBold} <span>{currentProgram.labelRest}</span>
              </p>
              <div
                className={styles.programDescription}
                dangerouslySetInnerHTML={{
                  __html: currentProgram.description ?? "",
                }}
              />
            </div>
            <div className={styles.indicators}>
              {programSteps.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${
                    index === currentProgramStep ? styles.active : ""
                  }`}
                  onClick={() => setCurrentProgramStep(index)}
                  aria-label={goToTemplate.replace("{n}", String(index + 1))}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.programRight}>
          <img
            src={currentProgram.bg}
            alt={t("integratorPage.program.titleLineOne")}
            className={styles.programRightImage}
            style={
              currentProgram.brightness
                ? { filter: `brightness(${currentProgram.brightness})` }
                : undefined
            }
          />
          <div className={styles.programRightOverlay}>
            <Link to={joinHref}>
              <GlassSurface
                width={300}
                borderRadius={50}
                displace={0.1}
                distortionScale={-10}
                saturation={1.5}
                redOffset={0}
                greenOffset={0}
                blueOffset={0}
                xChannel="R"
                yChannel="G"
                mixBlendMode="difference"
                brightness={100}
                opacity={0.93}
                blur={11}
                backgroundOpacity={0}
                className={styles.joinNowGlass}
              >
                <h2>{t("integratorPage.program.joinNow")}</h2>
              </GlassSurface>
            </Link>
          </div>
        </div>
      </section>

      {/* Application Workflow Section */}
      <section className={styles.workflowSection}>
        <h2 className={styles.workflowTitle}>
          {t("integratorPage.workflow.titleLineOne")}
          <br />
          <span>{t("integratorPage.workflow.titleLineTwo")}</span>
        </h2>

        <div className={styles.workflowSteps}>
          {workflowSteps.map((step, index) => (
            <div key={index} className={styles.workflowStepItem}>
              <button
                className={`${styles.workflowStep} ${
                  index === activeWorkflowStep ? styles.workflowStepActive : ""
                }`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setActiveWorkflowStep((prev) =>
                    prev === index ? null : index,
                  );
                }}
                aria-expanded={index === activeWorkflowStep}
              >
                <div className={styles.workflowStepHeader}>
                  <div className={styles.workflowStepIcon}>
                    <img
                      src={step.icon}
                      alt=""
                      className={styles.workflowStepImg}
                    />
                  </div>
                  <span className={styles.workflowStepNumber}>{step.step}</span>
                </div>
                <span className={styles.workflowStepLabel}>{step.title}</span>
              </button>
              <div
                className={`${styles.workflowStepContent} ${
                  index === activeWorkflowStep
                    ? styles.workflowStepContentOpen
                    : ""
                }`}
              >
                <div
                  className={styles.workflowStepContentInner}
                  dangerouslySetInnerHTML={{ __html: step.content ?? "" }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.workflowPanel}>
          <div className={styles.workflowPanelHeader}>
            <h3 className={styles.workflowPanelTitle}>
              {activeWorkflow.title}
            </h3>
          </div>
          <div
            className={styles.workflowPanelContent}
            dangerouslySetInnerHTML={{ __html: activeWorkflow.content ?? "" }}
          />
        </div>
      </section>

      {/* Download Contract Section */}
      <section className={styles.downloadSection}>
        <div className={styles.downloadContentWrapper}>
          <h2 className={styles.downloadTitle}>
            {t("integratorPage.download.titleLineOne")}
            <br />
            <span>{t("integratorPage.download.titleLineTwo")}</span>
          </h2>
          <div className={styles.downloadButtonWrapper}>
            <Button
              url="/INTEGRATORS_CONTRACT.pdf"
              text={t("integratorPage.download.cta")}
              download="INTEGRATORS_CONTRACT.pdf"
            />
          </div>
        </div>
        <div className={styles.origynWhiteLogoContainer}>
          <div className={styles.gradientBackground} />
          <img
            className={styles.origynWhiteLogo}
            src="/ogy_white.svg"
            alt="ORIGYN White Logo"
          />
        </div>
      </section>

      </PageLayout>
    </div>
  );
};

export default IntegratorPage;
