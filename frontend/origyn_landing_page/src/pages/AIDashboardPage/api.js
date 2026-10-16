export const GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL;
export const CREDITS_URL = import.meta.env.VITE_AI_CREDITS_URL;

// Renew a little before the gateway would answer 401, so a request started
// just before expiry doesn't fail mid-flight.
const RENEW_MARGIN_MS = 60_000;

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ?? `HTTP ${status}`);
    this.status = status;
    this.code = body?.error ?? "unknown";
  }
}

// A refusal stays a refusal: retrying a 4xx only delays the message. Rate
// limits and server or network failures get two more tries.
export const retryTransient = (failureCount, error) =>
  failureCount < 2 &&
  !(error instanceof ApiError && error.status < 500 && error.status !== 429);

const parse = (text) => {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
};

const request = async (url, { method = "GET", body, token, signal } = {}) => {
  const res = await fetch(url, {
    method,
    signal,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = parse(await res.text());
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
};

// expires_at is an int64 whose unit the spec leaves open: accept seconds,
// milliseconds or nanoseconds.
const toMillis = (value) => {
  if (value > 1e15) return value / 1e6;
  if (value > 1e12) return value;
  return value * 1000;
};

// One gateway session per Clerk user, shared by every query on the page.
// Concurrent callers wait on the same exchange instead of racing their own,
// so the panels can all start at once without one login each.
let session = null;
let pending = null;

const exchange = async (userId, getToken) => {
  const clerkToken = await getToken();
  const data = await request(`${GATEWAY_URL}/auth/clerk-session`, {
    method: "POST",
    body: { token: clerkToken },
  });
  session = { userId, token: data.token, expiresAt: toMillis(data.expires_at) };
  return session;
};

export const getSession = (userId, getToken, { renew = false } = {}) => {
  const fresh =
    session?.userId === userId &&
    session.expiresAt - Date.now() > RENEW_MARGIN_MS;
  if (fresh && !renew) return Promise.resolve(session);
  pending ??= exchange(userId, getToken).finally(() => {
    pending = null;
  });
  return pending;
};

const SERVICES = { gateway: GATEWAY_URL, credits: CREDITS_URL };

// Calls a service with the user's session, renewing it once on 401: the
// session lasts 24 hours and a 401 means the request was never processed.
export const authedRequest = async (auth, service, path, init = {}) => {
  const url = `${SERVICES[service]}${path}`;
  const { token } = await getSession(auth.userId, auth.getToken);
  try {
    return await request(url, { ...init, token });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const renewed = await getSession(auth.userId, auth.getToken, {
      renew: true,
    });
    return request(url, { ...init, token: renewed.token });
  }
};

export const fetchQuote = (usdCents, signal) =>
  request(`${CREDITS_URL}/quote?usd_cents=${usdCents}`, { signal });
