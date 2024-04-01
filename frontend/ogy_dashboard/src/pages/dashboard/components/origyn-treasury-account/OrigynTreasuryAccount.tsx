import { useMemo } from "react";
import Card from "@components/cards/Card";

type OrigynTreasuryAccount = {
  className?: string;
};

const OrigynTreasuryAccount = ({
  className,
  ...restProps
}: OrigynTreasuryAccount) => {
  const data = useMemo(
    () => [
      {
        value: 6957526202.66,
        token: "OGY",
      },
      {
        value: 6744999999.98,
        token: "ICP",
      },
    ],
    []
  );
  const borderBottomProps = useMemo(
    () => [
      {
        className: "bg-purple-500",
      },
      {
        className: "bg-pink-500",
      },
    ],
    []
  );

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="text-lg font-semibold">ORIGYN Treasury Account (OTA)</div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.map(({ value, token }, index) => (
          <Card className="bg-surface-2 mt-8 pb-8" key={token}>
            <div className="flex items-center text-lg font-semibold">
              <img src="/vite.svg" alt="OGY Logo" />
              <span className="ml-2 text-content/60">
                Network Revenue ({token})
              </span>
            </div>
            <div className="flex items-center mt-4 text-2xl font-semibold">
              <span className="mr-3">{value}</span>
              <span className="text-content/60">{token}</span>
            </div>
            <Card.BorderBottom
              className={`${borderBottomProps[index].className}`}
            />
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default OrigynTreasuryAccount;
