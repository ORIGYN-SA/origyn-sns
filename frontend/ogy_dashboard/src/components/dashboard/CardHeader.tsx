import { ReactNode } from "react";

type CardHeaderProps = {
  title: string;
  tooltip?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
};

const CardHeader = ({ title, tooltip, subtitle, right }: CardHeaderProps) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex flex-col gap-4 min-w-0">
      <div data-skel-static className="flex items-center gap-2">
        <h2 className="font-semibold text-[16px] leading-none text-muted">
          {title}
        </h2>
        {tooltip}
      </div>
      {subtitle}
    </div>
    {right && <div data-skel-static>{right}</div>}
  </div>
);

export default CardHeader;
