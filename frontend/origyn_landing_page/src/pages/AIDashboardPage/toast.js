import { useSyncExternalStore } from "react";

// A page-wide queue of short confirmations, so a mutation can report back
// from wherever it settles without threading callbacks through the panels.
const DURATION_MS = 4_000;

let toasts = [];
let nextId = 0;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

export const dismissToast = (id) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
};

export const toast = (message, { tone = "default" } = {}) => {
  const id = ++nextId;
  toasts = [...toasts, { id, message, tone }];
  emit();
  setTimeout(() => dismissToast(id), DURATION_MS);
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useToasts = () => useSyncExternalStore(subscribe, () => toasts);
