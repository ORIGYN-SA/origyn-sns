import { FC, ReactNode } from "react";
import clsx from "clsx";

type FeatureCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  variant?: "default" | "glass";
  className?: string;
};

const FeatureCard: FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  variant = "default",
  className,
}) => (
  <div
    className={clsx(
      "flex items-center gap-[10px] h-[88px] border border-border-faint rounded-[16px] p-2",
      variant === "glass"
        ? "bg-surface/50 backdrop-blur-xl"
        : "bg-surface-1/50",
      className
    )}
  >
    {icon && (
      <div className="shrink-0 w-[72px] h-[72px] flex items-center justify-center bg-surface-faint rounded-[16px] text-muted opacity-70">
        {icon}
      </div>
    )}
    <div className="min-w-0">
      <div className="font-medium text-[16px] leading-none text-muted">
        {title}
      </div>
      <div className="mt-1 font-normal text-[13px] leading-none text-muted">
        {description}
      </div>
    </div>
  </div>
);

export default FeatureCard;
