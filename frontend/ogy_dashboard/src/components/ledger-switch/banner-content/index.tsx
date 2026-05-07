import { PropsWithChildren } from "react";

const BannerContent = ({ children }: PropsWithChildren) => {
  return (
    <div>
      <div className="mb-8 max-w-[467px] mx-auto text-white font-normal text-[40px] leading-none text-center">
        We are switching ledger and governance
      </div>

      <p className="max-w-[467px] mx-auto text-white/80 font-light text-[16px] leading-[24px] text-center">
        ORIGYN governance and ledger have been upgraded to an SNS. In order to
        continue participating in ORIGYN governance and utilise OGY, you need to
        migrate your OGY tokens.
      </p>
      {children}
    </div>
  );
};

export default BannerContent;
