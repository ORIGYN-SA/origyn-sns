import { ChangeEvent } from "react";

type Option = { value: string; label: string };

type PeriodSelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
};

const PeriodSelect = ({ options, value, onChange }: PeriodSelectProps) => {
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative inline-flex items-center gap-2 rounded-full bg-white border border-[#E1E1E1] py-3 px-4 font-medium text-[13px] leading-none text-content">
      <span>{selected?.label ?? value}</span>
      <svg
        className="pointer-events-none shrink-0"
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6.64 2.98328L4.46667 5.15661C4.21 5.41328 3.79 5.41328 3.53333 5.15661L1.36 2.98328"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PeriodSelect;
