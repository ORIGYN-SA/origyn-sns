import { useMemo, useSyncExternalStore } from "react";

type Store = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
  getServerSnapshot: () => boolean;
};

const createStore = (threshold: number): Store => {
  let past = typeof window !== "undefined" && window.scrollY > threshold;
  const listeners = new Set<() => void>();

  const onScroll = () => {
    const next = window.scrollY > threshold;
    if (next !== past) {
      past = next;
      listeners.forEach((l) => l());
    }
  };

  return {
    subscribe(listener) {
      if (listeners.size === 0) {
        window.addEventListener("scroll", onScroll, { passive: true });
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          window.removeEventListener("scroll", onScroll);
        }
      };
    },
    getSnapshot() {
      return past;
    },
    getServerSnapshot() {
      return false;
    },
  };
};

const useScrolledPast = (threshold: number) => {
  const store = useMemo(() => createStore(threshold), [threshold]);
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
};

export default useScrolledPast;
