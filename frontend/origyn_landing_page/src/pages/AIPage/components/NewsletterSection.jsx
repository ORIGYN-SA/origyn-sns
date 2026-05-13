import Eyebrow from "./Eyebrow";
import SignupForm from "./SignupForm";

const NewsletterSection = () => (
  <section className="px-6 pt-20 pb-56 md:pt-28 md:pb-72">
    <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
      <Eyebrow>Stay close</Eyebrow>

      <h2 className="mt-8 m-0 text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[1.125] tracking-normal text-ink">
        <span className="font-normal italic">Follow</span> the research
      </h2>

      <p className="mt-10 max-w-[860px] text-base leading-[1.75] text-muted md:text-[1.0625rem]">
        Paper updates, technical milestones, project progress. No marketing.
        Only substance.
      </p>

      <div className="mt-12 flex w-full justify-center">
        <SignupForm />
      </div>
    </div>
  </section>
);

export default NewsletterSection;
