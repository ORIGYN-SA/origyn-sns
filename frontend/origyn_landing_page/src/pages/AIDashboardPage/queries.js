import { useAuth } from "@clerk/react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { authedRequest, fetchQuote, getSession, retryTransient } from "./api";
import { toE8s } from "./format";

const IN_FLIGHT = new Set([
  "quoted",
  "paid",
  "awaiting_liquidity",
  "awaiting_price",
]);
const INCOMING = new Set(["paid", "awaiting_liquidity", "awaiting_price"]);

export const isInFlight = (status) => IN_FLIGHT.has(status);
export const isIncoming = (status) => INCOMING.has(status);

export const queryKeys = {
  session: (userId) => ["ai", userId, "session"],
  balance: (userId) => ["ai", userId, "balance"],
  keys: (userId) => ["ai", userId, "keys"],
  orders: (userId) => ["ai", userId, "orders"],
  order: (userId, id) => ["ai", userId, "order", id],
  quote: (cents) => ["ai", "quote", cents],
};

// Binds the signed-in Clerk user to the API helpers. While Clerk is still
// loading userId is null and every authed query below waits, pending, which
// is what draws the skeletons.
const useApi = () => {
  const { userId, getToken } = useAuth();
  const auth = { userId, getToken };
  return {
    userId: userId ?? null,
    gateway: (path, init) => authedRequest(auth, "gateway", path, init),
    credits: (path, init) => authedRequest(auth, "credits", path, init),
  };
};

// Trades the Clerk login for an API session. The panels don't wait on it:
// their requests join the same exchange, so everything loads in parallel and
// this query only exists to surface a refused login once, for the whole page.
export const useSession = () => {
  const { userId, getToken } = useAuth();
  return useQuery({
    queryKey: queryKeys.session(userId),
    queryFn: () => getSession(userId, getToken),
    enabled: !!userId,
    staleTime: Infinity,
    retry: retryTransient,
  });
};

export const useBalance = () => {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.balance(api.userId),
    queryFn: ({ signal }) => api.credits("/balance", { signal }),
    enabled: !!api.userId,
    staleTime: 10_000,
    // Agents spend credits while the page is open.
    refetchInterval: 30_000,
    retry: retryTransient,
  });
};

const byNewest = (a, b) => b.created_at.localeCompare(a.created_at);

export const useKeys = () => {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.keys(api.userId),
    queryFn: ({ signal }) => api.gateway("/me/keys", { signal }),
    enabled: !!api.userId,
    select: (data) => data.keys.filter((key) => key.active).sort(byNewest),
    retry: retryTransient,
  });
};

const recordOrder = (queryClient, userId, order) => {
  const ordersKey = queryKeys.orders(userId);
  const previous = queryClient.getQueryData(ordersKey);
  const before = previous?.find((row) => row.id === order.id);
  if (previous) {
    queryClient.setQueryData(
      ordersKey,
      before
        ? previous.map((row) => (row.id === order.id ? order : row))
        : [order, ...previous],
    );
  }
  if (!isInFlight(order.status) && before?.status !== order.status) {
    queryClient.invalidateQueries({ queryKey: queryKeys.balance(userId) });
  }
};

export const useOrders = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.orders(api.userId),
    queryFn: async ({ signal }) => {
      const before =
        queryClient.getQueryData(queryKeys.orders(api.userId)) ?? [];
      const orders = await api.credits("/orders", { signal });
      const settled = before.some(
        (old) =>
          isInFlight(old.status) &&
          !isInFlight(orders.find((order) => order.id === old.id)?.status),
      );
      if (settled)
        queryClient.invalidateQueries({
          queryKey: queryKeys.balance(api.userId),
        });
      return orders;
    },
    enabled: !!api.userId,
    refetchInterval: (query) =>
      query.state.data?.some((order) => isIncoming(order.status))
        ? 5_000
        : false,
    retry: retryTransient,
  });
};

export const incomingCredits = (orders) =>
  (orders ?? [])
    .filter((order) => isIncoming(order.status))
    .reduce((sum, order) => sum + toE8s(order.credits_e8s), 0n);

const POLL_MS = 2_000;
// About a minute of polling, as the credits guide suggests; the order list
// keeps following it more slowly after that.
export const MAX_ORDER_POLLS = 30;

export const useOrder = (orderId) => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.order(api.userId, orderId),
    queryFn: async ({ signal }) => {
      const order = await api.credits(`/orders/${orderId}`, { signal });
      recordOrder(queryClient, api.userId, order);
      return order;
    },
    enabled: !!api.userId,
    refetchInterval: (query) =>
      isInFlight(query.state.data?.status) &&
      query.state.dataUpdateCount < MAX_ORDER_POLLS
        ? POLL_MS
        : false,
    retry: retryTransient,
  });
};

export const quoteOptions = (cents) => ({
  queryKey: queryKeys.quote(cents),
  queryFn: ({ signal }) => fetchQuote(cents, signal),
  staleTime: 30_000,
  retry: retryTransient,
});

export const useQuote = (cents) =>
  useQuery({
    ...quoteOptions(cents),
    enabled: cents !== null,
    placeholderData: keepPreviousData,
  });

// React keys for the rows of keys created on this page: a new key keeps the
// placeholder's row, so the row fills in where it stands instead of being
// swapped for another.
const rowKeys = new Map();
export const rowKey = (apiKey) => rowKeys.get(apiKey.id) ?? apiKey.id;

// The gateway shows a new key once and keeps only its hash, so the response
// carries nothing to list. A placeholder row stands in until the list is read
// back, then the key that wasn't there before takes over the placeholder's row.
export const useCreateKey = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const keysKey = queryKeys.keys(api.userId);
  return useMutation({
    mutationFn: async () => {
      // A managed user creates with an empty body on /keys; list and revoke
      // live under /me/keys. A nonce in the body would switch to the wallet flow.
      const { api_key } = await api.gateway("/keys", {
        method: "POST",
        body: {},
      });
      const list = await api.gateway("/me/keys");
      return { apiKey: api_key, list };
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: keysKey });
      const previous = queryClient.getQueryData(keysKey);
      const placeholder = {
        id: `pending-${Date.now()}`,
        prefix: "",
        created_at: new Date().toISOString(),
        active: true,
        pending: true,
      };
      queryClient.setQueryData(keysKey, (data) => ({
        keys: [placeholder, ...(data?.keys ?? [])],
      }));
      return { previous, placeholderId: placeholder.id };
    },
    onSuccess: ({ list }, _vars, context) => {
      const known = new Set(
        (context.previous?.keys ?? []).map((key) => key.id),
      );
      const created = list.keys.find((key) => key.active && !known.has(key.id));
      if (created) rowKeys.set(created.id, context.placeholderId);
      queryClient.setQueryData(keysKey, list);
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(keysKey, context?.previous);
      queryClient.invalidateQueries({ queryKey: keysKey });
    },
  });
};

export const useRevokeKey = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const keysKey = queryKeys.keys(api.userId);
  return useMutation({
    mutationFn: (id) => api.gateway(`/me/keys/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: keysKey });
      const previous = queryClient.getQueryData(keysKey);
      queryClient.setQueryData(
        keysKey,
        (data) => data && { keys: data.keys.filter((key) => key.id !== id) },
      );
      return { previous };
    },
    onError: (_error, _id, context) =>
      queryClient.setQueryData(keysKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keysKey }),
  });
};

export const useCheckout = () => {
  const api = useApi();
  return useMutation({
    mutationFn: ({ usdCents, here }) =>
      api.credits("/checkout", {
        method: "POST",
        body: {
          usd_cents: usdCents,
          // The API requires it; there is no terms text to accept yet, and
          // the dashboard asks for none.
          accept_terms: true,
          auto_redeem: false,
          // Stripe comes back to success_url?order=<id>; the marker on
          // cancel_url keeps an abandoned checkout from being polled.
          success_url: here,
          cancel_url: `${here}?checkout=cancelled`,
        },
      }),
    // The button stays busy through the redirect: the page is leaving.
    onSuccess: (order) => window.location.assign(order.checkout_url),
  });
};
