import Eyebrow from "./Eyebrow";
import Card from "./Card";
import GavelIcon from "./icons/GavelIcon";
import LayersIcon from "./icons/LayersIcon";
import KeyIcon from "./icons/KeyIcon";
import EyeIcon from "./icons/EyeIcon";
import GridIcon from "./icons/GridIcon";
import ShareIcon from "./icons/ShareIcon";
import CheckIcon from "./icons/CheckIcon";
import BadgeIcon from "./icons/BadgeIcon";

const VaultSection = () => (
  <section className="px-6 py-20 md:py-28">
    <div className="mx-auto flex max-w-6xl flex-col items-center">
      <Eyebrow>The vault</Eyebrow>

      <h2 className="mt-8 m-0 text-center text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
        <span className="font-normal italic">Certified</span> by construction.
      </h2>

      <p className="mt-8 max-w-[680px] text-center text-base leading-[1.75] text-muted md:text-[1.0625rem]">
        Every fragility addressed at the root. Not a promise. A protocol.
      </p>

      <div className="mt-12 grid w-full max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          align="left"
          icon={<GavelIcon />}
          title="Legal proof of existence"
        >
          Blockchain-certified timestamping. Admissible in court, no notary
          required.
        </Card>
        <Card align="left" icon={<GridIcon />} title="Full provenance">
          Who created, modified, certified each document. Immutable
          traceability chain.
        </Card>
        <Card align="left" icon={<LayersIcon />} title="Versioning">
          Every version preserved. Roll back at any time.
        </Card>
        <Card align="left" icon={<ShareIcon />} title="Controlled sharing">
          Read-only, time-limited, revocable in one click. Works even when
          offline.
        </Card>
        <Card align="left" icon={<KeyIcon />} title="Dead man’s switch">
          Designated heirs automatically recover access after a defined period
          of inactivity.
        </Card>
        <Card align="left" icon={<CheckIcon />} title="Immutable audit trail">
          Who saw what, when, why. Full regulatory compliance built in.
        </Card>
        <Card align="left" icon={<EyeIcon />} title="24/7 monitoring">
          The canister runs even when your PC is off. Automatic alerts for
          anomalies.
        </Card>
        <Card align="left" icon={<BadgeIcon />} title="Certified assets">
          Tokenized gold, real estate, collectibles. Provenance certificates
          alongside cognitive patrimony.
        </Card>
      </div>
    </div>
  </section>
);

export default VaultSection;
