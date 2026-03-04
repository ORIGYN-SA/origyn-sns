import { useState, useRef } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Button from "../Button/Button";
import styles from "./IntegratorPage.module.css";
import GlassSurface from "../GlassSurface.tsx";
import { Link } from "react-router-dom";

const programSteps = [
  {
    labelBold: "WHAT",
    labelRest: "IS THE INTEGRATOR PROGRAM ?",
    description:
      "The Integrator Program is a strategic initiative aimed at promoting the ORIGYN protocol, encouraging its adoption and broadening its ecosystem.",
    bg: "/integrator-program/what.webp",
    brightness: 1.15,
  },
  {
    labelBold: "WHO",
    labelRest: "ARE THE INTEGRATORS ?",
    description: `<ul><li><strong>Integrators are independent firms</strong> that build products based on the ORIGYN protocol with a common goal of minting ORIGYN certificates and promoting the ORIGYN protocol in a specific industry, in an asset class or across multiple sectors.</li><li><strong>Acting as enablers,</strong> they help businesses to adopt ORIGYN's blockchain certification technology without requiring deep blockchain and Web3 expertise.</li><li><strong>Following a vetting process</strong> conducted by the ORIGYN Foundation, integrators are elected and voted by the ORIGYN DAO token holders.</li></ul>`,
    bg: "/integrator-program/who.webp",
  },
  {
    labelBold: "HOW",
    labelRest: "DO YOU BECOME AN INTEGRATOR ?",
    description:
      "To become an integrator a company must show that it can deliver services at scale, while meeting all the requirements and expertise to serve a specific or multiple sectors.",
    bg: "/integrator-program/how.webp",
    brightness: 0.6,
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Application form",
    icon: "/app-workflow/whitepaper.svg",
    content: `<p>As part of the application, Integrators must fill the <strong><a href="/integrator/join">Project Application form online</a></strong> and prepare the <strong>Due Diligence Documentation</strong> to be sent at <strong><a href="mailto:admin@origyn.ch">admin@origyn.ch</a></strong></p>
<p>Due diligence documentation includes:</p>
<ul>
<li>Copy of Certificate of incorporation</li>
<li>Description of UBO - Unique Beneficial Owners</li>
<li>Copy of Memorandum & Articles of Association</li>
<li>Resolution of the Board of Directors that formalize the willingness to apply as Integrator and comply with Staking rules together with list of officials authorized to operate the Integrator</li>
<li>Identification of authorized signatories should be based on photographs and signature cards duly attested by the company</li>
<li>Copies of proof of identity and proof of address of managers, officers of employees holding Power of Attorney to transact business on its behalf</li>
<li>List of directors</li>
<li>Integrator Project Application Form</li>
</ul>`,
  },
  {
    step: "02",
    title: "Review from ORIGYN Foundation",
    icon: "/app-workflow/verification.svg",
    content: `<p>The first step to become an Integrator is to be validated by the ORIGYN Foundation after a due diligence process. The Integrator accepts to share all the documents requested with the purpose of fulfilling all KYC/KYB/AML required procedures.</p>`,
  },
  {
    step: "03",
    title: "Governance vote via ORIGYN DAO",
    icon: "/app-workflow/ogy.svg",
    content: `<p>PUBLIC VOTE BY ORIGYN DAO:</p>
<p>Once the Foundation concludes the vetting process, the Integrator will be subject to a DAO vote via a public proposal on the SNS Platform. All ORIGYN proposals can be viewed at <strong><a href="https://nns.ic0.app/proposals/?u=leu43-oiaaa-aaaaq-aadgq-cai" target="_blank" rel="noopener noreferrer">https://nns.ic0.app/proposals/?u=leu43-oiaaa-aaaaq-aadgq-cai</a></strong>.</p>
<p>Every change of either legal entity address, business name, or termination of cooperation is voted publicly on the SNS Platform.</p>`,
  },
  {
    step: "04",
    title: "Staking of 50,000,000 OGY",
    icon: "/app-workflow/governance.svg",
    content: `<p>If the proposal successfully passes, the Integrator will have to proceed to stake 50,000,000 OGY in the ORIGYN Governance for 1 year non dissolving.</p>
<p>This step ensures the long term commitment of the Integrator and voting power to participate actively in the governance of ORIGYN. All the Staked Neurons will be shown in the Dashboard publicly at <strong><a href="https://dashboard.origyn.com" target="_blank" rel="noopener noreferrer">https://dashboard.origyn.com</a></strong></p>
<p>All statistics such as Of certificates minted, TVL of certified assets, ect will be publicly shown under the integrator part on the <strong><a href="https://dashboard.origyn.com" target="_blank" rel="noopener noreferrer">https://dashboard.origyn.com</a></strong>.</p>`,
  },
  {
    step: "05",
    title: "Performance review",
    icon: "/app-workflow/performance.svg",
    content: `<p>Depending on each sector and commitment, minimum requirements for number of certificates minted can be part of the Integrator agreement. Hence ORIGYN Foundation will periodically conduct milestones and performance review of the Integrators.</p>
<p>All statistics such as n. of certificates minted, TVL of certified assets, etc. will be publicly shown under the integrator part on the <strong><a href="https://dashboard.origyn.com" target="_blank" rel="noopener noreferrer">https://dashboard.origyn.com</a></strong>.</p>`,
  },
];

const IntegratorPage = () => {
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

  return (
    <div className={styles.page}>
      <Header />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Become
            <br />
            an <span>Integrator</span>
          </h1>
          <p className={styles.heroSubtitle}>
            JOIN THE INTEGRATOR PROGRAM TO BUILD THE FUTURE OF TRUST WITH
            ORIGYN'S BLOCKCHAIN CERTIFICATION TECHNOLOGY
          </p>
          <Button url="/integrator/join" text="Join Now" />
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
                Integrator
                <br />
                <span>Program</span>
              </h2>
              <p className={styles.programLabel}>
                {programSteps[currentProgramStep].labelBold}{" "}
                <span>{programSteps[currentProgramStep].labelRest}</span>
              </p>
              <div
                className={styles.programDescription}
                dangerouslySetInnerHTML={{
                  __html: programSteps[currentProgramStep].description,
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
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.programRight}>
          <img
            src={programSteps[currentProgramStep].bg}
            alt="Integrator Program"
            className={styles.programRightImage}
            style={
              programSteps[currentProgramStep].brightness
                ? {
                    filter: `brightness(${programSteps[currentProgramStep].brightness})`,
                  }
                : undefined
            }
          />
          <div className={styles.programRightOverlay}>
            <Link
              to="/integrator/join"
              className="text-white text-2xl font-bold"
            >
              <GlassSurface
                width={300}
                // height={200}
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
                className="hover:opacity-80 transition-opacity duration-300"
              >
                <h2>Join now</h2>
              </GlassSurface>
            </Link>
          </div>
        </div>
      </section>

      {/* Application Workflow Section */}
      <section className={styles.workflowSection}>
        <h2 className={styles.workflowTitle}>
          Application
          <br />
          <span>workflow</span>
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
                  dangerouslySetInnerHTML={{ __html: step.content }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.workflowPanel}>
          <div className={styles.workflowPanelHeader}>
            <h3 className={styles.workflowPanelTitle}>
              {workflowSteps[activeWorkflowStep ?? 0].title}
            </h3>
          </div>
          <div
            className={styles.workflowPanelContent}
            dangerouslySetInnerHTML={{
              __html: workflowSteps[activeWorkflowStep ?? 0].content,
            }}
          />
        </div>
      </section>

      {/* Download Contract Section */}
      <section className={styles.downloadSection}>
        <div className={styles.downloadContentWrapper}>
          <h2 className={styles.downloadTitle}>
            Download
            <br />
            <span>Integrators Contract</span>
          </h2>
          <div className={styles.downloadButtonWrapper}>
            <Button
              url="/INTEGRATORS_CONTRACT.pdf"
              text="Download"
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

      <Footer />
    </div>
  );
};

export default IntegratorPage;
