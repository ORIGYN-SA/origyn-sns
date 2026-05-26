import Eyebrow from "./Eyebrow";
import Card from "./Card";
import UserIcon from "./icons/UserIcon";
import CubeIcon from "./icons/CubeIcon";
import { ScrollReveal } from "./AnimatedText";
import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";

const CARD_ICONS = [<UserIcon />, <CubeIcon />];

const AgentSection = () => {
  const t = useT();
  const titleLines = t("agent.title").split("\n");
  const cards = t.raw("agent.cards");

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
        <Eyebrow>{t("agent.eyebrow")}</Eyebrow>

        <h2 className="mt-8 m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
          {titleLines.map((line, i) => (
            <ScrollReveal as="span" key={i} className="block">
              <RichText text={line} />
            </ScrollReveal>
          ))}
        </h2>

        <ScrollReveal
          as="p"
          className="mt-12 max-w-[860px] text-base leading-[1.75] text-muted md:text-[1.0625rem]"
        >
          {t("agent.lead")}
        </ScrollReveal>

        <div className="mt-12 grid w-full max-w-[760px] grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title}>
              <Card
                icon={CARD_ICONS[i]}
                title={card.title}
                subtitle={card.subtitle}
              >
                {card.body}
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgentSection;
