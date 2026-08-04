import { useT } from "@/i18n/LocaleContext";
import { CheckMark, CrossMark, Section, SectionHeader } from "./primitives";

const BuildVsBuy = () => {
  const t = useT();
  const rows = t.raw("dpp.compare.rows") ?? [];

  return (
    <Section>
      <SectionHeader title={t("dpp.compare.title")} />

      <div className="mt-12 md:mt-14">
        <div className="grid grid-cols-2 gap-x-6 md:gap-x-16">
          <div>
            <span
              aria-hidden="true"
              className="block h-[3px] w-full rounded-full bg-hairline"
            />
            <h3 className="pt-4 text-[0.9375rem] font-medium tracking-tight text-ink/70 md:text-base">
              {t("dpp.compare.buildTitle")}
            </h3>
          </div>
          <div>
            <span
              aria-hidden="true"
              className="block h-[3px] w-full rounded-full bg-brand-gradient"
            />
            <h3 className="pt-4 text-[0.9375rem] font-medium tracking-tight text-ink md:text-base">
              {t("dpp.compare.origynTitle")}
            </h3>
          </div>
        </div>

        <ul className="mt-4 border-b border-hairline">
          {rows.map((row) => (
            <li
              key={row.build}
              className="grid grid-cols-2 gap-x-6 border-t border-hairline py-4 md:gap-x-16 md:py-5"
            >
              <p className="flex items-start gap-3 text-[0.8125rem] leading-[1.55] text-ink/70 md:text-[0.9375rem]">
                <CrossMark size="sm" className="mt-0.5" />
                <span className="sr-only">{t("dpp.compare.buildLabel")}</span>
                {row.build}
              </p>
              <p className="flex items-start gap-3 text-[0.8125rem] font-medium leading-[1.55] text-ink md:text-[0.9375rem]">
                <CheckMark size="sm" className="mt-0.5" />
                <span className="sr-only">{t("dpp.compare.origynLabel")}</span>
                {row.origyn}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
};

export default BuildVsBuy;
