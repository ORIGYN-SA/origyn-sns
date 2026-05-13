import Eyebrow from "./Eyebrow";
import BadgeIcon from "./icons/BadgeIcon";
import LayersIcon from "./icons/LayersIcon";
import ShareIcon from "./icons/ShareIcon";
import EyeIcon from "./icons/EyeIcon";
import GavelIcon from "./icons/GavelIcon";

const PILLARS = [
  {
    icon: <BadgeIcon />,
    title: "Trust",
    description: "Origyn certification — a verifiable trust signal.",
  },
  {
    icon: <LayersIcon />,
    title: "Context",
    description:
      "Decades of structured memory — a personal signal AI cannot match.",
  },
  {
    icon: <ShareIcon />,
    title: "Distribution",
    description: "Swiss Subnet — verifiable infrastructure for agents.",
  },
  {
    icon: <EyeIcon />,
    title: "Taste",
    description: "Auto-research pipeline — automation-assisted curation.",
  },
  {
    icon: <GavelIcon />,
    title: "Liability",
    description: "Audit trail and certificate — a real governance layer.",
  },
];

const VisionSection = () => (
  <section className="px-6 py-20 md:py-28">
    <div className="mx-auto flex max-w-5xl flex-col">
      <div className="flex flex-col items-center text-center">
        <Eyebrow>Vision</Eyebrow>

        <h2 className="mt-8 m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
          <span className="block">Five pillars</span>
          <span className="block">
            AI cannot <span className="font-normal italic">replace.</span>
          </span>
        </h2>

        <p className="mt-10 max-w-[680px] text-base leading-[1.75] text-muted md:text-[1.0625rem]">
          AI commoditizes production. These five domains remain. Origyn is
          positioned on every one of them.
        </p>
      </div>

      <ol className="mt-20 flex w-full flex-col border-t border-[#ececec]">
        {PILLARS.map((pillar, i) => {
          const padded = String(i + 1).padStart(2, "0");
          return (
            <li
              key={pillar.title}
              className="grid grid-cols-[auto_1fr] items-start gap-x-8 gap-y-3 border-b border-[#ececec] py-10 md:grid-cols-[5rem_3.5rem_1fr] md:items-center md:gap-x-10 md:py-14"
            >
              <span className="text-[clamp(2.25rem,4vw,3rem)] font-light leading-none tracking-[-0.04em]">
                <span className="text-gradient">{padded}</span>
              </span>

              <div className="row-start-1 col-start-2 flex justify-end md:justify-center md:col-start-2">
                {pillar.icon}
              </div>

              <div className="col-span-2 flex flex-col md:col-span-1 md:col-start-3">
                <h3 className="text-[clamp(1.5rem,2.5vw,1.875rem)] font-light tracking-tight text-ink">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-[1.7] text-muted md:max-w-[56ch] md:text-base">
                  {pillar.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  </section>
);

export default VisionSection;
