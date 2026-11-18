// Prints the operator wallet's private key as 64 hex digits, from GLDT_BRIDGE_OPERATOR_KEY, which holds one of:
// - the key as hex, with or without 0x;
// - a secp256k1 PEM (SEC1 "EC PRIVATE KEY", as dfx writes it, or PKCS#8 "PRIVATE KEY"), unencrypted;
// - that PEM as one line of base64, so GitLab can mask it;
// - the path to a file with any of these (a GitLab File variable).
// Errors never include the value.
const crypto = require("crypto");
const fs = require("fs");

// The order of the secp256k1 group: a private key is in [1, N - 1].
const N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");

function fail(message) {
    console.error(`error: GLDT_BRIDGE_OPERATOR_KEY: ${message}`);
    process.exit(1);
}

function fromHex(hex) {
    const d = BigInt(`0x${hex}`);
    if (d === 0n || d >= N) fail("the hex key is not a valid secp256k1 private key");
    return hex.toLowerCase();
}

function fromPem(pem) {
    let key;
    try {
        key = crypto.createPrivateKey(pem);
    } catch (e) {
        fail(`the PEM can't be read (${e.code || "unknown error"}); it must be an unencrypted private key`);
    }
    if (key.asymmetricKeyType !== "ec") fail(`the PEM holds a key of type ${key.asymmetricKeyType}; a wallet needs secp256k1`);
    const jwk = key.export({ format: "jwk" });
    if (jwk.crv !== "secp256k1") fail(`the PEM key is on the curve ${jwk.crv}; a wallet needs secp256k1`);
    return fromHex(Buffer.from(jwk.d, "base64url").toString("hex").padStart(64, "0"));
}

let value = (process.env.GLDT_BRIDGE_OPERATOR_KEY || "").trim();
if (!value) fail("not set; it comes from the protected environment");
if (!value.includes("\n") && !value.startsWith("-----") && fs.existsSync(value) && fs.statSync(value).isFile()) {
    value = fs.readFileSync(value, "utf8").trim();
}

let hex;
if (/^(0x)?[0-9a-fA-F]{64}$/.test(value)) {
    hex = fromHex(value.replace(/^0x/i, ""));
} else if (value.includes("-----BEGIN")) {
    hex = fromPem(value);
} else {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    if (!decoded.includes("-----BEGIN")) fail("not a hex private key, a PEM, or a PEM in base64");
    hex = fromPem(decoded);
}
process.stdout.write(hex);
