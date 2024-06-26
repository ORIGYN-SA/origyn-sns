import { PropsWithChildren } from "react";
import { Badge } from "@components/ui";

const BannerContent = ({ children }: PropsWithChildren) => {
  return (
    <div>
      <div className="flex justify-center items-center mb-16">
        <div className="flex items-center rounded-full bg-surface p-[2px]">
          <Badge className="bg-sky">
            <div className="text-white tracking-widest px-2 text-xs font-semibold uppercase xl:text-left text-center">
              IMPORTANT INFORMATION
            </div>
          </Badge>
          <div className="text-sm px-4">Ledger switch</div>
        </div>
      </div>

      <div className="text-center text-4xl mb-8">
        <div className="max-w-96 m-auto">
          We are switching ledger and governance
        </div>
      </div>

      <div className="grid xl:grid-cols-4">
        <div className="col-start-2 col-span-2 text-center text-content/60">
          <p>ORIGYN governance and ledger have been upgraded to an SNS. </p>
          <p>
            In order to continue participating in ORIGYN governance and utilise
            OGY, you need to swap your OGY tokens.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
};

export default BannerContent;
