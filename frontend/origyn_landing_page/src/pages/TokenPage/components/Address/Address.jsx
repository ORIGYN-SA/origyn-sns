import styles from "./Address.module.scss";
import GlassSurface from "@components/GlassSurface/GlassSurface";
import Iridescence from "../Iridescence/Iridescence";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import ContractAddressPill from "../ContractAddressPill/ContractAddressPill";

const Address = () => {
  return (
    <section className={styles.address}>
      <div className={styles.addressContent}>
        <h1 className={styles.addressTitle}>
          <ScrollReveal>
            OGY Token
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <b>
              Contract Address
            </b>
          </ScrollReveal>
        </h1>

        <ScrollReveal delay={0.25}>
          <p className={styles.addressDescription}>
            The OGY token is deployed on the Internet Computer blockchain and operates as a native utility token within the ORIGYN Protocol.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.35}>
          <ul>
            <li>
              This contract governs OGY’s issuance, transfers, and interactions across the protocol, ensuring transparency and on-chain verification of all token activity.
            </li>
            <li>
              You can view and interact with the OGY token directly through the ICP network.
            </li>
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.35}>
          <b className={styles.addressWarning}>
            Always verify the contract address before engaging with OGY.
          </b>
        </ScrollReveal>

        <ScrollReveal delay={0.45}>
          <ContractAddressPill />
        </ScrollReveal>
      </div>
      <div className={styles.addressButtonContainer}>
        <div className={styles.adressButtonBg}>
          <Iridescence
            color={[0.7, 0.7, 1]}
            speed={1.1}
            amplitude={0.1}
            style={{ position: "absolute" }}
          />
          <a
            href="https://coinmarketcap.com/currencies/origyn-foundation/"
          >
            <GlassSurface
              width={300}
              borderRadius={50}
              displace={0.1}
              distortionScale={-10}
              saturation={1.5}
              redOffset={0}
              greenOffset={0}
              blueOffset={0}
              xChannel="R"
              yChannel="G"
              mixBlendMode="difference"
              brightness={100}
              opacity={0.93}
              blur={11}
              backgroundOpacity={0}
              className={styles.addressButton}
            >
              <h2>View OGY</h2>
            </GlassSurface>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Address;
