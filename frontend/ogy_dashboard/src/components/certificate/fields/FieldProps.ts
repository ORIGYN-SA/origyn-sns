import {
  CertificateDataValue,
  TemplateBackground,
  TemplateItem,
} from "../types";

export type TabVariant = "certificate" | "custom";

export interface FieldProps {
  item: TemplateItem;
  data: CertificateDataValue | undefined;
  backgroundVariant: TemplateBackground["type"];
  tabVariant: TabVariant;
  selectedLanguage?: string;
}
