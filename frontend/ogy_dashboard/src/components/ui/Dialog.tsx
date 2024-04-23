import { Fragment } from "react";
import { Transition, Dialog as DialogHeadlessui } from "@headlessui/react";

const Dialog = ({ show = true, handleOnClose, children }) => {
  return (
    <Transition show={show} as={Fragment}>
      <div className="fixed z-50 inset-0 overflow-hidden">
        <DialogHeadlessui static as={Fragment} onClose={handleOnClose}>
          <div className="absolute z-50 inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-500"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-500"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <DialogHeadlessui.Overlay className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
            </Transition.Child>
            <div className="fixed flex justify-center h-screen w-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogHeadlessui.Panel className="bg-surface rounded-xl w-full max-w-xl transform transition-all my-auto">
                  {/* <DialogHeadlessui.Title>
                    Deactivate account
                  </DialogHeadlessui.Title> */}
                  {children}
                </DialogHeadlessui.Panel>
              </Transition.Child>
            </div>
          </div>
        </DialogHeadlessui>
      </div>
    </Transition>
  );
};

export default Dialog;
