import Eyebrow from "./Eyebrow";
import Card from "./Card";
import { ScrollReveal } from "./AnimatedText";
import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";
import GavelIcon from "./icons/GavelIcon";
import LayersIcon from "./icons/LayersIcon";
import KeyIcon from "./icons/KeyIcon";
import EyeIcon from "./icons/EyeIcon";
import GridIcon from "./icons/GridIcon";
import ShareIcon from "./icons/ShareIcon";
import CheckIcon from "./icons/CheckIcon";
import BadgeIcon from "./icons/BadgeIcon";

// Icons are positional and parallel to vault.cards in the catalog.
const CARD_ICONS = [
  <GavelIcon />,
  <GridIcon />,
  <LayersIcon />,
  <ShareIcon />,
  <KeyIcon />,
  <CheckIcon />,
  <EyeIcon />,
  <BadgeIcon />,
];

const VaultSection = () => {
  const t = useT();
  const cards = t.raw("vault.cards");

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center">
        <Eyebrow>{t("vault.eyebrow")}</Eyebrow>

        <ScrollReveal
          as="h2"
          className="mt-8 m-0 text-center text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink"
        >
          <RichText text={t("vault.title")} />
        </ScrollReveal>

        <ScrollReveal
          as="p"
          className="mt-8 max-w-[680px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]"
        >
          {t("vault.lead")}
        </ScrollReveal>

        <div className="mt-12 grid w-full max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title}>
              <Card align="left" icon={CARD_ICONS[i]} title={card.title}>
                {card.body}
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VaultSection;
