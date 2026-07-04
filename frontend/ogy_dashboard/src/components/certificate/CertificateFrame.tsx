import { ReactNode } from "react";
import CanisterImage from "./CanisterImage";
import { Certificate, TemplateBackground, TemplateSection } from "./types";
import { isCompanyLogoFieldId } from "./reservedFields";
import { getImageFromCertificate } from "./utils";

// Assets copied from the Minting Studio so certificates render identically.
const ORIGYN_LOGO_WHITE = "/origyn_logo_white.svg";
const STAMP_STANDARD = "/stamp_standard.svg";

type LogoSize = "sm" | "md" | "lg";

const LOGO_SIZE_MAP: Record<LogoSize, { standard: string; custom: string }> = {
  sm: { standard: "h-[32px] sm:h-[48px]", custom: "h-[32px] sm:h-[48px]" },
  md: { standard: "h-[48px] sm:h-[68px]", custom: "h-[48px] sm:h-[68px]" },
  lg: { standard: "h-[64px] sm:h-[88px]", custom: "h-[64px] sm:h-[88px]" },
};

interface CertificateFrameProps {
  id: string;
  template: TemplateSection;
  certificate: Certificate;
  children: ReactNode;
  background: TemplateBackground;
}

const CertificateFrame = ({
  id,
  children,
  background,
  template,
  certificate,
}: CertificateFrameProps) => {
  const { company_logo, stamp_upload } = certificate.data;

  const companyLogo = getImageFromCertificate(company_logo);
  const stampUrl = getImageFromCertificate(stamp_upload);

  const stampSrc = stampUrl || STAMP_STANDARD;
  const hasCustomBackground =
    background.type === "custom" && background.dataUri;
  const isVideoBackground =
    hasCustomBackground && background.mediaType === "video";

  const logoSize =
    (template.items.find(
      (item) => !item.hidden && isCompanyLogoFieldId(item.id)
    )?.size as LogoSize | undefined) || "md";
  const sizeClasses = LOGO_SIZE_MAP[logoSize];

  // Custom background layout
  if (hasCustomBackground) {
    return (
      <div className="w-full rounded-br-[24px] rounded-bl-[24px] bg-[#222526] px-4 py-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] sm:px-16 sm:py-10">
        <div className="relative mx-auto w-full max-w-[950px] sm:aspect-[19/27]">
          {/* Background media - full bleed */}
          <div className="absolute inset-0 overflow-hidden rounded-[16px]">
            {isVideoBackground ? (
              <video
                src={background.dataUri}
                className="absolute inset-0 h-full w-full object-cover"
                muted
                loop
                playsInline
                autoPlay
              />
            ) : (
              <CanisterImage
                src={background.dataUri!}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>

          <div className="relative flex flex-col items-center overflow-hidden rounded-[16px] p-4 pt-[64px] sm:p-8 md:p-12 lg:h-full lg:px-[64px] lg:pt-[120px]">
            {/* Stamp - floats above the glass panel */}
            <div
              className="absolute z-20 mx-auto flex w-fit !-translate-y-1/2 justify-center overflow-hidden rounded-full p-4"
              style={{
                background: "rgba(2, 2, 2, 0.1)",
                backdropFilter: "blur(8px)",
              }}
            >
              <img
                alt="Blockchain Certified"
                src={stampSrc}
                className="h-[70px] w-[70px] object-contain sm:h-[110px] sm:w-[110px]"
              />
            </div>
            {/* Glass panel overlay */}
            <div
              className="relative flex w-full flex-col items-center gap-8 rounded-[32px] p-6 pt-[96px] sm:gap-10 sm:rounded-[48px] sm:p-10 md:gap-10 md:p-12 lg:flex-1 lg:justify-between lg:gap-0 lg:p-[64px] lg:pb-[34px]"
              style={{
                background: "rgba(2, 2, 2, 0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center gap-8 sm:gap-10">
                <div className="flex w-full justify-center">
                  {companyLogo ? (
                    <CanisterImage
                      alt="Company Logo"
                      src={companyLogo}
                      className={`${sizeClasses.custom} object-contain brightness-0 invert`}
                    />
                  ) : (
                    <div className={sizeClasses.custom} />
                  )}
                </div>
                {children}
              </div>

              <div className="flex flex-col items-center gap-2">
                <img
                  alt="ORIGYN"
                  src={ORIGYN_LOGO_WHITE}
                  className="h-[35px] w-[38px] object-contain brightness-0 invert lg:h-[56px] lg:w-[58px]"
                />
                <p className="mt-0.5 text-center text-xs font-light tracking-wider text-white/80 uppercase lg:mt-1">
                  Powered by origyn
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-center text-xs tracking-wider text-white uppercase">
                    token id:
                  </p>
                  <p className="text-center text-xs tracking-wider text-white uppercase">
                    {id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard background layout
  return (
    <div className="w-full rounded-br-[24px] rounded-bl-[24px] bg-[#fcfafa] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="w-full rounded-br-[24px] rounded-bl-[24px] bg-[#222526] px-4 py-6 sm:px-16 sm:py-10">
        <div className="relative mx-auto w-full max-w-[950px] overflow-hidden rounded-2xl sm:aspect-[19/27]">
          <div className="relative h-full rounded-2xl bg-[#fcfafa]">
            {/* Standard gradient background at bottom */}
            <div className="absolute right-0 bottom-0 left-0 h-[300px] overflow-hidden opacity-60 sm:h-[400px]">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center bottom, rgba(168,237,234,0.4) 0%, rgba(254,214,227,0.3) 30%, rgba(210,153,194,0.2) 50%, transparent 70%)",
                }}
              />
            </div>

            {/* Navy curved badge holder */}
            <div className="absolute top-0 right-0 left-0 z-10 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 312 156"
                fill="none"
                className="h-[100px] w-[200px] sm:h-[156px] sm:w-[312px]"
              >
                <path
                  d="M156 0H0C43.0793 0 78 34.9207 78 78C78 121.079 112.921 156 156 156C199.079 156 234 121.079 234 78C234 34.9207 268.928 0 312.007 0H156.007H156Z"
                  fill="#061937"
                />
              </svg>
            </div>

            {/* Certificate content */}
            <div className="relative z-10 flex flex-col items-center gap-32 px-4 pt-8 pb-6 sm:gap-40 sm:px-8 sm:pt-12 sm:pb-10 md:gap-40 md:px-12 md:pt-16 md:pb-12 lg:h-full lg:justify-between lg:gap-0 lg:p-[64px]">
              {/* Header - logo and token id aligned with stamp */}
              <div className="flex w-full justify-between">
                <div className="flex flex-1 items-center border-b border-[rgba(105,115,124,0.2)] pb-4">
                  {companyLogo ? (
                    <CanisterImage
                      alt="Company Logo"
                      src={companyLogo}
                      className={`${sizeClasses.standard} object-contain`}
                    />
                  ) : (
                    <div className={sizeClasses.standard} />
                  )}
                </div>

                {/* Spacer for stamp badge */}
                <div className="w-[160px] shrink-0 sm:w-[280px]" />

                <div className="flex flex-1 items-center justify-end border-b border-[rgba(105,115,124,0.2)] pb-4">
                  <div className="text-right">
                    <p className="mb-1 text-[10px] leading-5 font-normal tracking-[2px] text-[#69737c] uppercase sm:text-[12px] sm:tracking-[3px]">
                      token id
                    </p>
                    <p className="text-[12px] leading-5 font-semibold tracking-[1.5px] text-[#222526] uppercase sm:text-[14px] sm:tracking-[2px]">
                      {id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic content slot */}
              <div className="flex w-full flex-col items-center justify-center gap-8 sm:gap-10">
                {children}
              </div>

              {/* ORIGYN logo bottom */}
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <img
                  alt="ORIGYN"
                  src={ORIGYN_LOGO_WHITE}
                  className="h-[50px] w-[52px] object-contain sm:h-[70px] sm:w-[72px]"
                />
                <p className="text-center text-[8px] leading-4 font-light tracking-[2px] text-[#9ca3af] uppercase sm:text-[10px] sm:leading-5 sm:tracking-[3px]">
                  Powered by origyn
                </p>
              </div>
            </div>

            {/* Stamp - positioned at top center within navy curved area */}
            <div className="absolute top-[15px] right-0 left-0 z-20 flex justify-center sm:top-[22px]">
              <img
                alt="Blockchain Certified"
                src={stampSrc}
                className="h-[70px] w-[70px] object-contain sm:h-[110px] sm:w-[110px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateFrame;
