import Button from "../Button/Button";

const TokenizedGold = ({ id }) => {
  return (
    <section id={id} className="bg-white">
      <div className="grid grid-cols-1 xl:grid-cols-2">
        <div className="relative overflow-hidden order-2 xl:order-1">
          <img
            src="/tokenized-gold.jpg"
            alt="Tokenized Gold"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="order-1 xl:order-2 flex-1 flex justify-center py-16 md:py-16 px-6 md:pl-16 md:pr-20 bg-linear-to-br from-amber-100/60 to-transparent">
          <div className="text-left max-w-130">
            <h2 className="font-['General_Sans'] font-light text-[44px] md:text-[88px] leading-none text-[#1a1a1a] mb-8">
              Tokenized
              <br />
              <span className="font-['General_Sans_Italic'] font-extralight text-[48px] md:text-[96px]">
                Swiss Gold
              </span>
            </h2>

            <p className="font-['General_Sans'] font-light text-sm md:text-base leading-8 tracking-[0.05em] uppercase text-[#222526] mb-4">
              GLDT turns physical gold into a digital asset secured in Swiss
              vaults, available anytime.
            </p>

            <p className="font-['General_Sans'] font-light text-sm md:text-base leading-8 tracking-[0.05em] uppercase text-[#222526] mb-8">
              The Gold Token (GLDT) is a digital token backed 100% by real gold.
              Each token equals 0.01 grams of physical gold, safely stored in
              vaults in Switzerland. It lets you own gold without needing to
              store or handle it yourself—plus, you can send it instantly and
              trade it easily, with no storage fees.
            </p>

            <Button text="Discover GLDT" url="https://gldt.org" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TokenizedGold;
