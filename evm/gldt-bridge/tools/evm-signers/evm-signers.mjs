#!/usr/bin/env node
// Prints the two EVM addresses gldt_swap signs with. They are the same on Ethereum and Base.
//   claims: the contract's icpSigner, signs claim vouchers (ICP to EVM)
//   admin:  the contract's adminSigner, signs execute() calls (SNS approved actions)
//
// The IC answers ecdsa_public_key only to canisters, so a script can't ask it directly. This script
// derives the keys offline from the IC's published master key with DFINITY's @dfinity/ic-pub-key,
// which is the same math the IC runs. The result depends only on the canister id, the key name and
// the derivation path, not on the canister's code, so it works before the bridge module exists.
//
// Before printing anything, it proves the method against two live mainnet canisters that sign with
// key_1. It asks each for an address and checks that the same derivation reproduces it:
//   ckETH minter: empty derivation path, Ethereum address
//   ckBTC minter: three part derivation path, Bitcoin deposit address
// If either check fails, it exits with code 1 and prints no addresses.
//
// Usage:
//   npm ci
//   node evm-signers.mjs                                    mainnet gldt_swap, key_1
//   node evm-signers.mjs --canister <staging id> --key test_key_1
//   node evm-signers.mjs --json                             machine readable, for the deploy script

import { Actor, HttpAgent } from '@dfinity/agent';
import { ecdsa } from '@dfinity/ic-pub-key';
import { Principal } from '@dfinity/principal';
import { payments } from 'bitcoinjs-lib';
import { computeAddress, getAddress } from 'ethers';

const { PublicKeyWithChainCode, DerivationPath } = ecdsa.secp256k1;

const GLDT_SWAP = '6f6ua-hqaaa-aaaar-qairq-cai';
const IC_HOST = 'https://icp-api.io';

// These must match the bridge module byte for byte: derivation_path = vec![b"<name>".to_vec()].
const ROLES = [
  { role: 'claims', contractField: 'icpSigner', signs: 'claim vouchers', path: 'gldt-bridge-claims-v1' },
  { role: 'admin', contractField: 'adminSigner', signs: 'execute() calls', path: 'gldt-bridge-admin-v1' },
];

const CKETH_MINTER = 'sv3dd-oaaaa-aaaar-qacoa-cai';
const CKBTC_MINTER = 'mqygn-kiaaa-aaaar-qaadq-cai';
const ckethIdl = ({ IDL }) =>
  IDL.Service({
    get_minter_info: IDL.Func([], [IDL.Record({ minter_address: IDL.Opt(IDL.Text) })], ['query']),
  });
const ckbtcIdl = ({ IDL }) =>
  IDL.Service({
    get_btc_address: IDL.Func(
      [IDL.Record({ owner: IDL.Opt(IDL.Principal), subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })],
      [IDL.Text],
      [],
    ),
  });

function parseArgs(argv) {
  const opts = { canister: GLDT_SWAP, key: 'key_1', json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--canister') opts.canister = argv[++i];
    else if (a === '--key') opts.key = argv[++i];
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') {
      console.log('node evm-signers.mjs [--canister <id>] [--key key_1|test_key_1] [--json]');
      process.exit(0);
    } else fail(`unknown argument: ${a}`);
  }
  if (!['key_1', 'test_key_1'].includes(opts.key)) fail(`--key must be key_1 or test_key_1, got ${opts.key}`);
  try {
    opts.canister = Principal.fromText(opts.canister).toText();
  } catch {
    fail(`not a valid canister id: ${opts.canister}`);
  }
  return opts;
}

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

const hex = (bytes) => Buffer.from(bytes).toString('hex');
const utf8 = (s) => new TextEncoder().encode(s);

// Public key (33 byte compressed, hex) for canisterId under keyId with the given path parts.
function derivePublicKey(keyId, canisterId, parts) {
  const path = DerivationPath.withCanisterPrefix(Principal.fromText(canisterId), parts);
  return PublicKeyWithChainCode.forMainnetKey(keyId).deriveSubkeyWithChainCode(path).public_key.toHex();
}

async function withRetries(what, fn) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === 3) fail(`could not ask the IC for ${what} after 3 tries: ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function liveChecks(agent) {
  // ckETH minter: its Ethereum address comes from key_1 with an empty path.
  const ckethLive = await withRetries('the ckETH minter address', async () => {
    const minter = Actor.createActor(ckethIdl, { agent, canisterId: CKETH_MINTER });
    return (await minter.get_minter_info()).minter_address[0];
  });
  if (!ckethLive) fail('the ckETH minter returned no address');
  const ckethDerived = computeAddress('0x' + derivePublicKey('key_1', CKETH_MINTER, []));

  // ckBTC minter: the deposit address for an account comes from key_1 with the path
  // [ [1], owner principal bytes, 32 byte subaccount ]. We use gldt_swap as the owner.
  const owner = Principal.fromText(GLDT_SWAP);
  const ckbtcLive = await withRetries('a ckBTC deposit address', async () => {
    const minter = Actor.createActor(ckbtcIdl, { agent, canisterId: CKBTC_MINTER });
    return minter.get_btc_address({ owner: [owner], subaccount: [] });
  });
  const ckbtcKey = derivePublicKey('key_1', CKBTC_MINTER, [Uint8Array.of(1), owner.toUint8Array(), new Uint8Array(32)]);
  const ckbtcDerived = payments.p2wpkh({ pubkey: Buffer.from(ckbtcKey, 'hex') }).address;

  return [
    { canister: CKETH_MINTER, what: 'ckETH minter address', ic: getAddress(ckethLive), derived: ckethDerived, ok: getAddress(ckethLive) === ckethDerived },
    { canister: CKBTC_MINTER, what: 'ckBTC deposit address for gldt_swap', ic: ckbtcLive, derived: ckbtcDerived, ok: ckbtcLive === ckbtcDerived },
  ];
}

const opts = parseArgs(process.argv.slice(2));
const agent = await HttpAgent.create({ host: IC_HOST });
const checks = await liveChecks(agent);
for (const c of checks) {
  if (!c.ok) fail(`derivation does not match the IC (${c.what}: IC says ${c.ic}, derived ${c.derived}). Do not use any address from this script.`);
}

const signers = ROLES.map((r) => {
  const parts = [utf8(r.path)];
  const publicKey = derivePublicKey(opts.key, opts.canister, parts);
  return { ...r, pathHex: hex(parts[0]), publicKey, address: computeAddress('0x' + publicKey) };
});

if (opts.json) {
  const out = { canister: opts.canister, key: opts.key, checks };
  for (const s of signers) {
    out[s.role] = { contractField: s.contractField, path: [s.path], pathHex: [s.pathHex], publicKey: s.publicKey, address: s.address };
  }
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`canister   ${opts.canister}`);
  console.log(`key        ${opts.key}`);
  for (const c of checks) console.log(`check      ${c.what}: IC says ${c.ic}, derived ${c.derived}, match`);
  if (opts.key !== 'key_1') {
    console.log('           (the checks prove the method with key_1; confirm test_key_1 against get_bridge_evm_signers on staging)');
  }
  for (const s of signers) {
    console.log('');
    console.log(`${s.role}  (${s.contractField}, signs ${s.signs})`);
    console.log(`  path        ["${s.path}"]  hex ${s.pathHex}`);
    console.log(`  public key  ${s.publicKey}`);
    console.log(`  address     ${s.address}`);
  }
  console.log('');
  console.log('Same addresses on Ethereum and Base.');
}
