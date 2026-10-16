import { dismissToast, useToasts } from "../toast";

const Toaster = () => {
  const toasts = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => dismissToast(item.id)}
          className={`pointer-events-auto max-w-md cursor-pointer rounded-full px-5 py-3 text-sm shadow-lg motion-safe:animate-[ai-toast-in_180ms_ease-out] ${
            item.tone === "error"
              ? "bg-red-600 text-white"
              : "bg-navy text-surface"
          }`}
        >
          {item.message}
        </button>
      ))}
      <style>{`@keyframes ai-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
};

export default Toaster;
