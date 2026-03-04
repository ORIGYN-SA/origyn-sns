/* ─── helpers ─── */

function buildBody(data) {
  const lines = [];
  const add = (label, value) => {
    if (value != null && String(value).trim() !== "")
      lines.push(`${label}: ${String(value).trim()}`);
  };
  add("Full Name", data.fullName);
  add("Email", data.email);
  add("Phone", data.phone);
  add("Vision", data.vision);
  add("Industry Category", data.industryCategory);
  add("Market Geography", data.marketGeography);
  if (Array.isArray(data.websiteSocialLinks))
    data.websiteSocialLinks
      .filter(Boolean)
      .forEach((link, i) => add(`Website/Social Link ${i + 1}`, link));
  add("Presentation Link", data.presentationLinks);
  add("Why does this project need to exist", data.whyProjectExists);
  add("Why become an Integrator", data.whyBecomeIntegrator);
  add("Objectif 01", data.objectif01);
  add("Objectif 02", data.objectif02);
  if (Array.isArray(data.objectives))
    data.objectives
      .filter(Boolean)
      .forEach((obj, i) => add(`Objectif ${i + 3}`, obj));
  add("KPI 01", data.kpi01);
  add("KPI 02", data.kpi02);
  if (Array.isArray(data.kpis))
    data.kpis.filter(Boolean).forEach((k, i) => add(`KPI ${i + 3}`, k));
  add("Focus / Success", data.focusDetail);
  add("Plan to implement", data.planImplement);
  add("Roadmaps (3 months & 3 years)", data.roadmaps);
  add("Team", data.team);
  add("Risk Factors", data.riskFactors);
  add("Optional", data.optional);
  return lines.join("\n");
}

/* ─── base64 / base64url encoding ─── */

function bytesToBase64(bytes) {
  const arr = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function base64url(input) {
  const b64 = typeof input === "string" ? btoa(input) : bytesToBase64(input);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ─── Import PEM private key for RS256 signing ─── */

async function importPrivateKey(pem) {
  const body = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/* ─── Create a signed JWT for Google OAuth2 ─── */

async function createSignedJwt({ clientEmail, privateKey, impersonateEmail }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    sub: impersonateEmail,
    scope: "https://www.googleapis.com/auth/gmail.send",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(signature)}`;
}

/* ─── Exchange JWT for Google access token ─── */

async function getAccessToken({ clientEmail, privateKey, impersonateEmail }) {
  const jwt = await createSignedJwt({
    clientEmail,
    privateKey,
    impersonateEmail,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

/* ─── Send email via Gmail API ─── */

async function sendGmail({
  accessToken,
  from,
  to,
  cc,
  replyTo,
  subject,
  body,
  attachment,
}) {
  const headers = [`From: ${from}`, `To: ${to}`];
  if (cc) headers.push(`Cc: ${cc}`);
  if (replyTo) headers.push(`Reply-To: ${replyTo}`);

  let mime;

  if (attachment) {
    const boundary = "____boundary_" + Date.now();
    mime = [
      ...headers,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
      `--${boundary}`,
      `Content-Type: ${attachment.type}; name="${attachment.name}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.name}"`,
      "",
      attachment.data.replace(/(.{76})/g, "$1\r\n"),
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    mime = [
      ...headers,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
    ].join("\r\n");
  }

  const raw = base64url(new TextEncoder().encode(mime));

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${err}`);
  }
  return res.json();
}

/* ─── Worker entry ─── */

export default {
  async fetch(request, env) {
    const cors = { "Access-Control-Allow-Origin": "*" };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...cors,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    /* Validate required secrets/vars */
    const privateKey = env.GOOGLE_PRIVATE_KEY;
    const clientEmail = env.GOOGLE_CLIENT_EMAIL;
    const impersonateEmail = env.GOOGLE_IMPERSONATE_EMAIL;

    if (!privateKey || !clientEmail || !impersonateEmail) {
      return new Response(
        JSON.stringify({
          error:
            "Missing Google config. Set GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, GOOGLE_IMPERSONATE_EMAIL.",
        }),
        {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const to = env.TO_EMAIL;
    const cc = env.CC_EMAILS || "";
    const text = buildBody(data);

    const attachment =
      data.logoBase64 && data.logoName
        ? {
            data: data.logoBase64,
            name: data.logoName,
            type: data.logoType || "application/octet-stream",
          }
        : null;

    try {
      const accessToken = await getAccessToken({
        clientEmail,
        privateKey,
        impersonateEmail,
      });
      await sendGmail({
        accessToken,
        from: impersonateEmail,
        to,
        cc,
        replyTo: data.email,
        subject: "Integrator Program Application",
        body: text,
        attachment,
      });

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};
