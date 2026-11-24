import { atom, useSetAtom } from "jotai";

/** Set by the account menu's Transfer item; the Wallet page opens its transfer dialog and clears it. */
export const transferRequestAtom = atom(0);

export const evmDialogAtom = atom(false);

export const useEvmDialog = () => {
  const set = useSetAtom(evmDialogAtom);
  return { open: () => set(true), close: () => set(false) };
};
