import { useState, useCallback } from "react";

const CopyToClipboard = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard write can fail in insecure contexts or if permission denied
    }
  }, [value]);

  return (
    <button
      data-skel-hide
      onClick={handleCopy}
      className="inline-flex items-center justify-center shrink-0 h-4 w-4 p-0 leading-none align-middle"
    >
      {copied ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted"
          >
            <path
              d="M3.33333 8.33333L6.66667 11.6667L13.3333 4.33333"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted"
          >
            <path
              d="M10.6667 8.60004V11.4C10.6667 13.7334 9.73333 14.6667 7.4 14.6667H4.6C2.26667 14.6667 1.33333 13.7334 1.33333 11.4V8.60004C1.33333 6.26671 2.26667 5.33337 4.6 5.33337H7.4C9.73333 5.33337 10.6667 6.26671 10.6667 8.60004Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.6667 4.60004V7.40004C14.6667 9.73337 13.7333 10.6667 11.4 10.6667H10.6667V8.60004C10.6667 6.26671 9.73333 5.33337 7.4 5.33337H5.33333V4.60004C5.33333 2.26671 6.26667 1.33337 8.6 1.33337H11.4C13.7333 1.33337 14.6667 2.26671 14.6667 4.60004Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
      )}
    </button>
  );
};

export default CopyToClipboard;
