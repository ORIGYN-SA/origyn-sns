import Eyebrow from "./Eyebrow";
import Card from "./Card";
import UserIcon from "./icons/UserIcon";
import CubeIcon from "./icons/CubeIcon";
import { ScrollReveal } from "./AnimatedText";

const AgentSection = () => (
  <section className="px-6 py-20 md:py-28">
    <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
      <Eyebrow>The agent</Eyebrow>

      <h2 className="mt-8 m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
        <ScrollReveal as="span" className="block">
          Origyn.
        </ScrollReveal>
        <ScrollReveal as="span" className="block">
          Minimal <span className="font-normal italic">agent,</span> maximal{" "}
          <span className="font-normal italic">memory.</span>
        </ScrollReveal>
      </h2>

      <ScrollReveal
        as="p"
        className="mt-12 max-w-[860px] text-base leading-[1.75] text-muted md:text-[1.0625rem]"
      >
        A sovereign AI agent running on-chain. Its first mission: the Sovereign
        Second Brain. A small model fed by decades of your structured context,
        certified on the Swiss blockchain. Not a giant model on-chain. A
        focused agent with a certified vault.
      </ScrollReveal>

      <div className="mt-12 grid w-full max-w-[760px] grid-cols-1 gap-4 md:grid-cols-2">
        <ScrollReveal>
          <Card icon={<UserIcon />} title="User side" subtitle="Local Bureau">
            The user’s machine. Large language models, private files, offline
            work. Your intelligence stays with you.
          </Card>
        </ScrollReveal>
        <ScrollReveal>
          <Card
            icon={<CubeIcon />}
            title="Blockchain side"
            subtitle="On-Chain Vault"
          >
            The canister. Certified vault, verifiable inference, deterministic
            replay. Your context becomes provable infrastructure.
          </Card>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

export default AgentSection;
