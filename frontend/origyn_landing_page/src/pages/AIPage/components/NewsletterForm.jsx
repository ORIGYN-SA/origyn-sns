import { useState } from "react";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire up to newsletter backend
  };

  return (
    <div className="w-full max-w-[600px] rounded-full bg-gradient-to-r from-[#1F9CD4] to-[#1E2345] p-[1px]">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2 rounded-full bg-canvas py-1.5 pl-7 pr-1.5"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourmail@gmail.com"
          aria-label="Email address"
          required
          className="flex-1 border-0 bg-transparent py-3 text-[15px] font-light text-ink underline decoration-muted underline-offset-[6px] outline-none placeholder:text-muted focus:decoration-navy"
        />
        <button
          type="submit"
          className="cursor-pointer whitespace-nowrap rounded-full bg-gradient-to-r from-navy to-[#1F9CD4] px-6 py-3 text-[13px] font-normal text-surface transition-opacity hover:opacity-90"
        >
          Get Notified
        </button>
      </form>
    </div>
  );
};

export default NewsletterForm;
