import { useT } from "@i18n/LocaleContext";

const Warning = () => {
  const t = useT();
  return (
    <div className="text-white py-2 flex items-center justify-center">
      <div className="bg-charcoalLight rounded-full inline-flex items-center pt-[2px] pe-2 pb-[2px] ps-1 gap-2">
        <span className="bg-sky rounded-full inline-flex items-center justify-center font-extrabold text-[10px] leading-[22px] tracking-[2px] uppercase px-[9px] shrink-0 text-charcoal">
          {t("warning.badge")}
        </span>
        <span className="font-medium text-[12px] leading-none">
          {t("warning.ledgerSwitch")}
        </span>
      </div>
    </div>
  );
};

export default Warning;
