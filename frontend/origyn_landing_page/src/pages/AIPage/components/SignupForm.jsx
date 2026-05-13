import { useState } from "react";

const SignupForm = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire up to newsletter backend
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[600px] flex-col items-stretch gap-2 rounded-3xl border border-hairline bg-surface p-2 sm:flex-row sm:items-center sm:rounded-full sm:py-1.5 sm:pl-7 sm:pr-1.5"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="yourmail@gmail.com"
        aria-label="Email address"
        required
        className="flex-1 border-0 bg-transparent py-3 text-base font-normal text-ink underline decoration-muted underline-offset-[6px] outline-none placeholder:text-muted focus:decoration-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      />
      <button
        type="submit"
        className="cursor-pointer whitespace-nowrap rounded-full bg-navy px-6 py-3 text-[0.8125rem] font-normal text-surface transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        Get Notified
      </button>
    </form>
  );
};

export default SignupForm;
