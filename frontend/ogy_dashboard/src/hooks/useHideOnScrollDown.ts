import { useMemo, useSyncExternalStore } from "react";

type Options = {
  topOffset?: number;
  threshold?: number;
};

type Store = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
  getServerSnapshot: () => boolean;
};

const createStore = ({ topOffset = 80, threshold = 4 }: Options): Store => {
  let hidden = false;
  let lastY = typeof window !== "undefined" ? window.scrollY : 0;
  const listeners = new Set<() => void>();

  const onScroll = () => {
    const y = window.scrollY;
    const delta = y - lastY;
    let next = hidden;
    if (y < topOffset) next = false;
    else if (delta > threshold) next = true;
    else if (delta < -threshold) next = false;
    lastY = y;
    if (next !== hidden) {
      hidden = next;
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
      return hidden;
    },
    getServerSnapshot() {
      return false;
    },
  };
};

const useHideOnScrollDown = (options: Options = {}) => {
  const store = useMemo(
    () => createStore(options),
    [options.topOffset, options.threshold]
  );
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
};

export default useHideOnScrollDown;
