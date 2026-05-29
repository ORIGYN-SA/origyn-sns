import { Fragment, ReactNode } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const Select = ({
  options,
  value,
  handleOnChange,
  className,
  placeholder,
}: {
  options: Array<{ value: string | number }>;
  value: string | number;
  handleOnChange: (v: string | number) => void;
  className?: string;
  placeholder?: ReactNode;
}) => {
  const displayValue = value === "" ? placeholder : value;

  return (
    <div className={`${className}`}>
      <Listbox value={value} onChange={handleOnChange}>
        <div className="relative mt-1">
          <ListboxButton className="relative w-full cursor-default rounded-xl bg-surface-2 py-2 ps-3 pe-10 text-start border border-border focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate">{displayValue}</span>
            <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2">
              <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute mt-1 max-h-60 w-auto overflow-auto rounded-xl bg-surface-2 z-50 py-1 text-base border border-border focus:outline-none sm:text-sm">
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  className={({ focus }) =>
                    `relative cursor-default select-none py-2 ps-10 pe-4 ${
                      focus ? "bg-accent/10 text-accent" : ""
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.value}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-accent">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-content/10">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default Select;
