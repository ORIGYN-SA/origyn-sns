import { ChangeEvent } from "react";
import { ChevronDownIcon } from "@components/ui/icons";

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
      <ChevronDownIcon className="pointer-events-none shrink-0" />
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
