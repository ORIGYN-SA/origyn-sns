import Eyebrow from "./Eyebrow";
import Card from "./Card";
import UserIcon from "./icons/UserIcon";
import CubeIcon from "./icons/CubeIcon";

const AgentSection = () => (
  <section className="px-6 py-32 md:py-40">
    <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
      <Eyebrow>The agent</Eyebrow>

      <h2 className="mt-8 m-0 text-[clamp(40px,7vw,80px)] font-extralight leading-[1.125] tracking-normal text-ink">
        Origyn.
        <br />
        Minimal <span className="font-normal italic">agent,</span> maximal{" "}
        <span className="font-normal italic">memory.</span>
      </h2>

      <p className="mt-12 max-w-[920px] text-[15px] leading-[1.85] text-muted">
        A sovereign AI agent running on-chain. Its first mission: the Sovereign
        Second Brain. A small model fed by decades of your structured context,
        certified on the Swiss blockchain. Not a giant model on-chain. A
        focused agent with a certified vault.
      </p>

      <div className="mt-16 grid w-full max-w-[760px] grid-cols-1 gap-4 md:grid-cols-2">
        <Card icon={<UserIcon />} title="User side" subtitle="Local Bureau">
          The user’s machine. Large language models, private files, offline
          work. Your intelligence stays with you.
        </Card>
        <Card
          icon={<CubeIcon />}
          title="Blockchain side"
          subtitle="On-Chain Vault"
        >
          The user’s machine. Large language models, private files, offline
          work. Your intelligence stays with you.
        </Card>
      </div>
    </div>
  </section>
);

export default AgentSection;
