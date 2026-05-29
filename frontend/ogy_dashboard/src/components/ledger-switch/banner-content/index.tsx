import { PropsWithChildren } from "react";
import { useT } from "@i18n/LocaleContext";

const BannerContent = ({ children }: PropsWithChildren) => {
  const t = useT();

  return (
    <div>
      <div className="mb-6 sm:mb-8 max-w-[467px] mx-auto text-white font-normal text-[28px] leading-tight sm:text-[40px] sm:leading-none text-center">
        {t("account.ledgerSwitch.banner.title")}
      </div>

      <p className="max-w-[467px] mx-auto text-white/80 font-light text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-center">
        {t("account.ledgerSwitch.banner.description")}
      </p>
      {children}
    </div>
  );
};

export default BannerContent;
