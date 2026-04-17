import {
  createContext,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useContext,
  useId,
  useMemo,
} from "react";
import clsx from "clsx";
import { ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = createContext<ChartContextValue | null>(null);

const useChart = () => {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("Chart components must be used inside <ChartContainer>");
  return ctx;
};

type ChartContainerProps = HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: ReactNode;
};

export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = useId();
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

    const colorVars = useMemo(
      () =>
        Object.entries(config)
          .filter(([, v]) => v.color)
          .map(([key, v]) => `  --color-${key}: ${v.color};`)
          .join("\n"),
      [config]
    );

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          data-chart={chartId}
          className={clsx(
            "flex aspect-video justify-center text-xs",
            "[&_.recharts-cartesian-axis-tick_text]:fill-content/60",
            "[&_.recharts-surface]:outline-none",
            className
          )}
          {...props}
        >
          {colorVars && (
            <style
              dangerouslySetInnerHTML={{
                __html: `[data-chart=${chartId}] {\n${colorVars}\n}`,
              }}
            />
          )}
          <ResponsiveContainer>{children as any}</ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = RechartsTooltip;

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string | number;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string | number) => ReactNode;
  hideLabel?: boolean;
  indicator?: "dot" | "line";
};

export const ChartTooltipContent = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  hideLabel = false,
  indicator = "dot",
}: ChartTooltipContentProps) => {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[100px] bg-surface-1 p-[15px] text-xs text-muted shadow-[0_4px_30px_0_rgb(0_0_0/0.1)] flex flex-col gap-[5px]">
      {!hideLabel && label !== undefined && (
        <div className="font-semibold text-[13px] leading-none text-muted">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="flex flex-col gap-[5px] font-light text-[12px] leading-[16px] text-muted">
        {payload.map((item, i) => {
          const key = item.dataKey;
          const cfg = config[key];
          const color = item.color ?? `var(--color-${key})`;
          return (
            <div key={i} className="flex items-center gap-2">
              {indicator === "dot" ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ) : (
                <span
                  className="h-0.5 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <span>{cfg?.label ?? item.name}</span>
              <span className="ml-auto font-mono font-medium tabular-nums">
                {formatter ? formatter(item.value) : item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
