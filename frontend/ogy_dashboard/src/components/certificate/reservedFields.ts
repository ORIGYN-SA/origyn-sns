// Reserved field IDs, mirroring the Minting Studio's semantics: these fields
// are rendered by the certificate frame itself (logo, main image, description)
// and must be skipped by the dynamic field renderer.

const TITLE_FIELDS = ["name", "certificate_title", "title", "product_name"];
const IMAGE_FIELDS = [
  "stamp_upload",
  "certificate_image",
  "product_images",
  "product_image",
];
const DESCRIPTION_FIELDS = ["certificate_description"];
const COMPANY_LOGO_FIELDS = ["company_logo", "logo", "brand_logo"];

export const isTitleFieldId = (fieldId: string): boolean =>
  TITLE_FIELDS.includes(fieldId);

export const isImageFieldId = (fieldId: string): boolean =>
  IMAGE_FIELDS.includes(fieldId);

export const isDescriptionFieldId = (fieldId: string): boolean =>
  DESCRIPTION_FIELDS.includes(fieldId);

export const isCompanyLogoFieldId = (fieldId: string): boolean =>
  COMPANY_LOGO_FIELDS.includes(fieldId);
