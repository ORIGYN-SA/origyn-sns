import { Fragment, ReactNode } from "react";
import {
  Transition,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useT } from "@i18n/LocaleContext";

const CLOSE_BUTTON_CLASSES =
  "h-9 w-9 rounded-full border border-border bg-surface flex items-center justify-center text-content transition-colors hover:bg-surface-2";

const DialogComponent = ({
  show = true,
  handleClose,
  enableClose = true,
  children,
  panelClassName = "max-w-xl",
  floatingClose = false,
  headerStart,
}: {
  show: boolean;
  handleClose: () => void;
  children?: ReactNode;
  enableClose?: boolean;
  panelClassName?: string;
  floatingClose?: boolean;
  headerStart?: ReactNode;
}) => {
  const t = useT();
  return (
    <Transition show={show} as={Fragment}>
      <div className="fixed z-50 inset-0 overflow-hidden">
        <Dialog
          static
          as={Fragment}
          onClose={enableClose ? handleClose : () => null}
        >
          <div className="absolute z-50 inset-0 overflow-hidden">
            <TransitionChild
              as={Fragment}
              enter="ease-in-out duration-150"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
            </TransitionChild>
            <div className="fixed flex justify-center h-screen w-full p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-150"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel
                  className={`bg-surface rounded-xl w-full ${panelClassName} transform transition-all my-auto relative`}
                >
                  {floatingClose ? (
                    enableClose && (
                      <button
                        type="button"
                        onClick={handleClose}
                        aria-label={t("common.close")}
                        className={`absolute end-3 top-3 z-10 ${CLOSE_BUTTON_CLASSES}`}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )
                  ) : (
                    <DialogTitle className="flex items-center justify-between gap-3 px-4 pt-4">
                      {headerStart ?? <span />}
                      {enableClose && (
                        <button
                          type="button"
                          onClick={handleClose}
                          aria-label={t("common.close")}
                          className={CLOSE_BUTTON_CLASSES}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </DialogTitle>
                  )}
                  {children}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </div>
    </Transition>
  );
};

export default DialogComponent;
