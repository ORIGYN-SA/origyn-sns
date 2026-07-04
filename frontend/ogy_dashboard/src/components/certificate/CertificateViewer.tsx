import { useState } from "react";
import { Certificate, TemplateStructure } from "./types";
import { getLocalizedText } from "./utils";
import CertificateFrame from "./CertificateFrame";
import CertificateTabs, { CertificateTab } from "./CertificateTabs";
import DynamicTabContent from "./DynamicTabContent";
import InformationFrame from "./InformationFrame";

interface CertificateViewerProps {
  certificate: Certificate;
  template: TemplateStructure;
  selectedLanguage?: string;
  certificateTabLabel?: string;
}

const CERTIFICATE_SECTION_ID = "section_certificate";

// Renders a certificate with its Minting Studio template: the certificate
// "paper" plus one information tab per additional template section.
const CertificateViewer = ({
  certificate,
  template,
  selectedLanguage = "en",
  certificateTabLabel = "Certificate",
}: CertificateViewerProps) => {
  const [activeTab, setActiveTab] = useState<CertificateTab>("certificate");

  const dynamicTabs = template.sections
    .filter((section) => section.id !== CERTIFICATE_SECTION_ID)
    .map((section) => ({ id: section.id, label: section.name }));

  const renderTabContent = () => {
    if (activeTab === "certificate") {
      const certificateSectionTemplate = template.sections.find(
        (section) => section.id === CERTIFICATE_SECTION_ID
      );

      if (!certificateSectionTemplate) return null;

      return (
        <CertificateFrame
          id={certificate.id}
          certificate={certificate}
          template={certificateSectionTemplate}
          background={template.background}
        >
          <DynamicTabContent
            tabVariant="certificate"
            backgroundVariant={template.background.type}
            template={certificateSectionTemplate}
            certificate={certificate}
            selectedLanguage={selectedLanguage}
          />
        </CertificateFrame>
      );
    }

    const activeSectionTemplate = template.sections.find(
      (section) => section.id === activeTab
    );

    if (!activeSectionTemplate) return null;

    const certificateTitle = getLocalizedText(
      certificate.data.certificate_title,
      selectedLanguage
    );
    const certificateName = getLocalizedText(
      certificate.name,
      selectedLanguage
    );

    return (
      <InformationFrame
        title={{
          artworkTitle: certificateTitle || certificateName || undefined,
        }}
        sectionTitle={activeSectionTemplate.name}
      >
        <DynamicTabContent
          template={activeSectionTemplate}
          certificate={certificate}
          tabVariant="custom"
          backgroundVariant={template.background.type}
          selectedLanguage={selectedLanguage}
        />
      </InformationFrame>
    );
  };

  return (
    <div className="bg-[#FCFAFA] rounded-[24px]">
      <CertificateTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        certificateTabLabel={certificateTabLabel}
        dynamicTabs={dynamicTabs}
      />
      {renderTabContent()}
    </div>
  );
};

export default CertificateViewer;
