import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Identity } from "@dfinity/agent";
import type { AuthClientStorage } from "@dfinity/auth-client";
import { DelegationChain, Ed25519KeyIdentity } from "@dfinity/identity";
import { Principal } from "@dfinity/principal";
import {
  IdentityKitDelegationSignerClient,
  InternetIdentity,
  OISY,
} from "@amerej/identitykit";
import { WalletProvider, useWalletContext } from "./WalletProvider";

type StoredKey = Parameters<AuthClientStorage["set"]>[1];
type DelegationClientOptions = Parameters<
  typeof IdentityKitDelegationSignerClient.create
>[0];

type Session = {
  user: { principal: Principal } | undefined;
  identity: Identity | undefined;
};

// What IdentityKit's React hooks would hand the provider for this session.
const session = vi.hoisted<Session>(() => ({
  user: undefined,
  identity: undefined,
}));

vi.mock("@amerej/identitykit/react", () => ({
  useAuth: () => ({
    user: session.user,
    isConnecting: false,
    connect: async () => {},
    disconnect: async () => {},
  }),
  // useAgent always returns an agent once a user is restored, even when that
  // agent signs as anonymous.
  useAgent: () => (session.user ? {} : undefined),
  useIdentity: () => session.identity,
  useIsInitializing: () => false,
}));

const memoryLocalStorage = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
};

// Runs IdentityKit's page-load restore over what an earlier Internet Identity
// login left in storage, with a delegation expiring `expiresInMs` from now.
const restoreInternetIdentitySession = async (expiresInMs: number) => {
  const iiUser = Ed25519KeyIdentity.generate();
  const sessionKey = Ed25519KeyIdentity.generate();
  const delegationChain = await DelegationChain.create(
    iiUser,
    sessionKey.getPublicKey(),
    new Date(Date.now() + expiresInMs)
  );
  const stored = new Map<string, StoredKey>([
    ["identity-client", JSON.stringify(sessionKey.toJSON())],
    ["delegation-client", JSON.stringify(delegationChain.toJSON())],
    ["connected-owner", iiUser.getPrincipal().toText()],
  ]);
  const storage: AuthClientStorage = {
    get: async (key) => stored.get(key) ?? null,
    set: async (key, value) => void stored.set(key, value),
    remove: async (key) => void stored.delete(key),
  };
  localStorage.setItem("connected", "1");
  localStorage.setItem("signerId", InternetIdentity.id);

  const client = await IdentityKitDelegationSignerClient.create({
    storage,
    idleOptions: { disableIdle: true },
    // Restoring a session never talks to the signer, and the fork bundles its
    // own copy of the Signer class, so a real one can't be built here.
    signer: {} as DelegationClientOptions["signer"],
  });
  session.user = client.connectedUser;
  session.identity = client.getIdentity();
  return iiUser.getPrincipal();
};

const WalletState = () => {
  const { isConnected, sessionExpired, principalId } = useWalletContext();
  return (
    <>{`${principalId} connected=${isConnected} expired=${sessionExpired}`}</>
  );
};

const render = () =>
  renderToString(
    <WalletProvider>
      <WalletState />
    </WalletProvider>
  );

describe("WalletProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryLocalStorage());
    // IdentityKit schedules its delegation-expiry logout on window.
    vi.stubGlobal("window", {
      addEventListener: () => {},
      removeEventListener: () => {},
      setTimeout: () => 0,
      clearTimeout: () => {},
    });
    session.user = undefined;
    session.identity = undefined;
  });

  it("asks an Internet Identity user to reconnect when the restored delegation has expired", async () => {
    const user = await restoreInternetIdentitySession(-60_000);

    expect(render()).toBe(`${user.toText()} connected=false expired=true`);
  });

  it("keeps an Internet Identity user connected while the delegation is valid", async () => {
    const user = await restoreInternetIdentitySession(3_600_000);

    expect(render()).toBe(`${user.toText()} connected=true expired=false`);
  });

  it("keeps an OISY user connected, since OISY signs every call in the wallet", () => {
    const user = Ed25519KeyIdentity.generate().getPrincipal();
    localStorage.setItem("signerId", OISY.id);
    session.user = { principal: user };
    session.identity = undefined;

    expect(render()).toBe(`${user.toText()} connected=true expired=false`);
  });
});
