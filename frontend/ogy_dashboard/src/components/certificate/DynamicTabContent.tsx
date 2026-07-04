import { Certificate, TemplateBackground, TemplateSection } from "./types";
import {
  isCompanyLogoFieldId,
  isDescriptionFieldId,
  isImageFieldId,
} from "./reservedFields";
import { FieldProps, TabVariant } from "./fields/FieldProps";
import FieldText from "./fields/FieldText";
import FieldBadge from "./fields/FieldBadge";
import FieldImage from "./fields/FieldImage";
import FieldVideo from "./fields/FieldVideo";
import FieldSignature from "./fields/FieldSignature";

interface DynamicTabContentProps {
  template: TemplateSection;
  certificate: Certificate;
  backgroundVariant: TemplateBackground["type"];
  tabVariant: TabVariant;
  selectedLanguage?: string;
}

const fieldComponents: Record<
  string,
  ((props: FieldProps) => JSX.Element | null) | undefined
> = {
  input: FieldText,
  readonly: FieldText,
  image: FieldImage,
  badge: FieldBadge,
  video: FieldVideo,
  signature: FieldSignature,
};

// Fields the certificate frame renders itself (logo, main image, description)
// are skipped here, matching the Minting Studio behaviour.
const isReservedCertificateField = (id: string) =>
  isCompanyLogoFieldId(id) || isImageFieldId(id) || isDescriptionFieldId(id);

const DynamicTabContent = ({
  template,
  certificate,
  backgroundVariant,
  tabVariant,
  selectedLanguage,
}: DynamicTabContentProps) => (
  <>
    {[...template.items]
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        if (item.hidden) return null;
        if (isReservedCertificateField(item.id)) return null;

        const Component = fieldComponents[item.type];

        return Component ? (
          <Component
            key={item.id}
            item={item}
            data={certificate.data[item.id]}
            backgroundVariant={backgroundVariant}
            tabVariant={tabVariant}
            selectedLanguage={selectedLanguage}
          />
        ) : null;
      })}
  </>
);

export default DynamicTabContent;
