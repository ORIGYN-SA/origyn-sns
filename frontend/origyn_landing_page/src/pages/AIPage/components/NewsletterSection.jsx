import Eyebrow from "./Eyebrow";
import SignupForm from "./SignupForm";
import { ScrollReveal } from "./AnimatedText";
import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";

const NewsletterSection = () => {
  const t = useT();
  return (
    <section className="px-6 pt-20 pb-56 md:pt-28 md:pb-72">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <Eyebrow>{t("newsletter.eyebrow")}</Eyebrow>

        <h2 className="mt-8 m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
          <RichText text={t("newsletter.title")} />
        </h2>

        <ScrollReveal
          as="p"
          className="mt-10 max-w-[860px] text-base leading-[1.75] text-muted md:text-[1.0625rem]"
        >
          {t("newsletter.lead")}
        </ScrollReveal>

        <div className="mt-12 flex w-full justify-center">
          <SignupForm />
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
