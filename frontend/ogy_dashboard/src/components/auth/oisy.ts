import { HttpAgent, type Agent } from "@dfinity/agent";
import { SubAccount } from "@dfinity/ledger-icp";
import type { Principal } from "@dfinity/principal";
import { Signer } from "@slide-computer/signer";
import {
  SignerAgent,
  type SignerAgentOptions,
} from "@slide-computer/signer-agent";
import { PostMessageTransport } from "@slide-computer/signer-web";

import { DERIVATION_ORIGIN } from "./constants";

const OISY_PROVIDER_URL = "https://oisy.com/sign";
const ICRC_95_STANDARD = "ICRC-95";

type OisyConnectArgs = {
  host: string;
};

export type OisySession = {
  principal: Principal;
  subAccount?: SubAccount;
  agent: Agent;
  signer: Signer;
};

class OisyAgent implements Agent {
  constructor(
    private readonly signerAgent: Agent,
    private readonly queryAgent: HttpAgent,
    private readonly principal: Principal
  ) {}

  get rootKey() {
    return this.queryAgent.rootKey;
  }

  getPrincipal() {
    return Promise.resolve(this.principal);
  }

  call(...params: Parameters<Agent["call"]>) {
    return this.signerAgent.call(...params);
  }

  query(...params: Parameters<Agent["query"]>) {
    return this.queryAgent.query(...params);
  }

  readState(...params: Parameters<Agent["readState"]>) {
    return this.signerAgent.readState(...params);
  }

  createReadStateRequest(
    ...params: Parameters<NonNullable<Agent["createReadStateRequest"]>>
  ) {
    if (this.signerAgent.createReadStateRequest) {
      return this.signerAgent.createReadStateRequest(...params);
    }

    if (this.queryAgent.createReadStateRequest) {
      return this.queryAgent.createReadStateRequest(...params);
    }

    return Promise.resolve({ body: { content: {} } });
  }

  status() {
    return this.queryAgent.status();
  }

  fetchRootKey() {
    return this.queryAgent.fetchRootKey();
  }
}

const createOisyTransport = () =>
  new PostMessageTransport({
    url: OISY_PROVIDER_URL,
    detectNonClickEstablishment: false,
    disconnectTimeout: 10_000,
  });

const supportsDerivationOrigin = async (signer: Signer): Promise<boolean> => {
  try {
    const standards = await signer.supportedStandards();
    return standards.some(
      (standard) => standard.name.toUpperCase() === ICRC_95_STANDARD
    );
  } catch {
    return false;
  }
};

const toSubAccount = (subaccount?: ArrayBuffer): SubAccount | undefined => {
  if (!subaccount) return undefined;
  const parsed = SubAccount.fromBytes(new Uint8Array(subaccount));
  if (parsed instanceof Error) {
    throw parsed;
  }
  return parsed;
};

const readFirstAccount = async (signer: Signer) => {
  const accounts = await signer.accounts();
  const account = accounts[0];
  if (!account) {
    throw new Error("OISY did not return any accounts.");
  }
  return {
    principal: account.owner,
    subAccount: toSubAccount(account.subaccount),
  };
};

export const connectOisy = async ({
  host,
}: OisyConnectArgs): Promise<OisySession> => {
  const transport = createOisyTransport();
  const baseSigner = new Signer({ transport });
  const shouldUseDerivationOrigin = await supportsDerivationOrigin(baseSigner);
  let signer = shouldUseDerivationOrigin
    ? new Signer({ transport, derivationOrigin: DERIVATION_ORIGIN })
    : baseSigner;

  let account: Awaited<ReturnType<typeof readFirstAccount>>;
  try {
    account = await readFirstAccount(signer);
  } catch (err) {
    if (!shouldUseDerivationOrigin) throw err;
    signer = baseSigner;
    account = await readFirstAccount(baseSigner);
  }

  const baseAgent = new HttpAgent({ host });
  const signerAgentOptions: SignerAgentOptions<Signer> = {
    signer,
    account: account.principal,
    agent: baseAgent,
  };
  const signerAgent = await SignerAgent.create(signerAgentOptions);

  return {
    ...account,
    agent: new OisyAgent(signerAgent, baseAgent, account.principal),
    signer,
  };
};

export const disconnectOisy = async (
  session: OisySession | null
): Promise<void> => {
  try {
    await session?.signer.closeChannel();
  } catch {
    /* ignore double-disconnects or already closed channels */
  }
};
