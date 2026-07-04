import { ReactNode } from "react";

interface InformationFrameProps {
  title?: {
    artistName?: string;
    artworkTitle?: string;
    year?: string;
  };
  sectionTitle?: string;
  children: ReactNode;
  className?: string;
}

// Visual wrapper for the information tabs: dark background, two-column layout
// with the title on the left and dynamic template content on the right.
const InformationFrame = ({
  title,
  sectionTitle,
  children,
  className = "",
}: InformationFrameProps) => {
  const hasTitle = title?.artistName || title?.artworkTitle || sectionTitle;

  return (
    <div
      className={`h-full w-full rounded-br-[24px] rounded-bl-[24px] bg-[#fcfafa] ${className}`}
    >
      <div className="flex min-h-full w-full flex-col gap-16 rounded-br-[24px] rounded-bl-[24px] bg-[#222526]">
        <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-16 sm:py-10 xl:flex-row xl:gap-12">
          {/* Left column - title */}
          <div className="hidden w-full shrink py-4 sm:flex lg:top-0 lg:max-w-[389px] xl:py-10">
            <div>
              {sectionTitle && (
                <p className="mb-2 text-[12px] leading-5 font-semibold tracking-[2px] text-[#e1e1e1] uppercase sm:text-[14px] sm:tracking-[3px]">
                  {sectionTitle}
                </p>
              )}
              {title?.artworkTitle && (
                <p className="mb-0 text-[#f9f8f4]">
                  <span className="text-[24px] leading-[32px] font-extralight italic sm:text-[38px] sm:leading-[50px]">
                    {title.artworkTitle}
                  </span>
                </p>
              )}
            </div>
          </div>
          {/* Right column - dynamic content */}
          <div
            className={`flex flex-1 flex-col py-4 sm:py-10 md:min-w-[350px] ${!hasTitle ? "w-full" : ""}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformationFrame;
