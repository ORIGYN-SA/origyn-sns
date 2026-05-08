const Warning = () => {
  return (
    <div className="text-white py-2 flex items-center justify-center">
      <div className="bg-charcoalLight rounded-full inline-flex items-center pt-[2px] pr-2 pb-[2px] pl-1 gap-2">
        <span className="bg-sky rounded-full inline-flex items-center justify-center font-extrabold text-[10px] leading-[22px] tracking-[2px] uppercase px-[9px] shrink-0 text-charcoal">
          NEW
        </span>
        <span className="font-medium text-[12px] leading-none">
          we are switching ledger, you need to swap your OGY to the new one
        </span>
      </div>
    </div>
  );
};

export default Warning;
