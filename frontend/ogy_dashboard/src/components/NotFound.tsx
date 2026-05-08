const HeroBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
  >
    <div
      className="w-[1238px] aspect-[41/20]"
      style={{
        background: `
          radial-gradient(ellipse at 70% 80%, rgba(80,190,143,0.32), transparent 50%),
          radial-gradient(ellipse at 55% 65%, rgba(31,156,212,0.32), transparent 50%),
          radial-gradient(ellipse at 30% 75%, rgba(123,63,160,0.22), transparent 50%)
        `,
        maskImage:
          "radial-gradient(ellipse at center, black 10%, transparent 65%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 10%, transparent 65%)",
      }}
    />
  </div>
);

const NotFound = () => {
  return (
    <section className="relative isolate overflow-hidden">
      <HeroBackground />
      <div className="flex flex-col items-center gap-4 text-center max-w-[640px] mx-auto pt-24 pb-16 px-6 sm:pt-40 sm:pb-32">
        <h1 className="font-extrabold text-[100px] sm:text-[180px] leading-none tracking-[-0.06em] text-content">
          404
        </h1>
        <h2 className="font-extrabold text-[28px] leading-[32px] sm:text-[40px] sm:leading-[44px] tracking-[-0.03em] text-content">
          Page not found
        </h2>
        <p className="font-light text-[16px] sm:text-[18px] leading-relaxed text-muted">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have
          moved.
        </p>
      </div>
    </section>
  );
};

export default NotFound;
