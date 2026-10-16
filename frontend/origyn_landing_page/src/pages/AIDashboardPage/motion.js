const EASE = [0.4, 0, 0.2, 1];
export const RESIZE = { duration: 0.3, ease: EASE };

// An item that grows in and shrinks out of a list, for use inside
// <AnimatePresence initial={false}>, so its neighbours slide instead of jump.
export const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: RESIZE },
  exit: { height: 0, opacity: 0, transition: RESIZE },
  style: { overflow: "hidden" },
};
