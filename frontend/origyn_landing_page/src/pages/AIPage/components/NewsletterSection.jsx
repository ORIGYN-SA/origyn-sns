import Eyebrow from "./Eyebrow";
import NewsletterForm from "./NewsletterForm";

const NewsletterSection = () => (
  <section className="px-6 py-32 md:py-40">
    <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
      <Eyebrow>Stay close</Eyebrow>

      <h2 className="mt-8 m-0 text-[clamp(40px,7vw,80px)] font-extralight leading-[1.125] tracking-normal text-ink">
        <span className="font-normal italic">Follow</span> the research
      </h2>

      <p className="mt-10 max-w-[860px] text-[15px] leading-[1.85] text-muted">
        Paper updates, technical milestones, project progress. No marketing.
        Only substance.
      </p>

      <div className="mt-12">
        <NewsletterForm />
      </div>

      <p className="mt-8 text-[13px] text-muted">
        Research updates only. No spam.
      </p>
    </div>
  </section>
);

export default NewsletterSection;
