import { PropsWithChildren } from "react";
import { Badge } from "@components/ui";

const BannerContent = ({ children }: PropsWithChildren) => {
  return (
    <div>
      <div className="flex justify-center items-center mb-16">
        <div className="flex items-center rounded-full bg-black/20">
          <Badge className="bg-sky">
            <div className="text-white tracking-widest px-4 py-1 text-xs font-semibold uppercase xl:text-left text-center">
              IMPORTANT INFORMATION
            </div>
          </Badge>
          <div className="text-sm py-2 px-4 font-semibold text-white">
            Ledger switch
          </div>
        </div>
      </div>

      <div className="text-center text-4xl mb-8">
        <div className="max-w-96 m-auto text-white">
          We are switching ledger and governance
        </div>
      </div>

      <div className="grid xl:grid-cols-4">
        <div className="col-start-2 col-span-2 text-center text-white/80">
          <p>ORIGYN governance and ledger have been upgraded to an SNS. </p>
          <p>
            In order to continue participating in ORIGYN governance and utilise
            OGY, you need to migrate your OGY tokens.
          </p>
        </div>
      </div>
      {children}
    </div>
  );
};

export default BannerContent;
