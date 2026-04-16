const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type PageItem = number | "ellipsis";

const buildPageItems = (pageIndex: number, pageCount: number): PageItem[] => {
  if (pageCount <= 0) return [];
  if (pageCount <= 7)
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  const current = pageIndex + 1;
  const items: PageItem[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  if (start > 2) items.push("ellipsis");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < pageCount - 1) items.push("ellipsis");
  items.push(pageCount);
  return items;
};

type TablePaginationProps = {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const TablePagination = ({
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) => {
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;
  const pageItems = buildPageItems(pageIndex, pageCount);

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-[#86858A]">
        <span>Lines per page</span>
        <div className="relative inline-flex items-center gap-[5px] rounded-full bg-white border border-[#E1E1E1] py-[5px] px-[10px] font-medium text-[13px] leading-none text-content">
          <span>{pageSize}</span>
          <svg
            className="pointer-events-none shrink-0"
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.64 2.98328L4.46667 5.15661C4.21 5.41328 3.79 5.41328 3.53333 5.15661L1.36 2.98328"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {canPrev && (
          <button
            type="button"
            onClick={() => onPageChange(pageIndex - 1)}
            aria-label="Previous page"
            className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-[#69737C] hover:bg-[#F1F6F9]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {pageItems.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex items-center justify-center h-7 min-w-7 text-[#69737C]"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item - 1)}
              className={`inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full ${
                item - 1 === pageIndex
                  ? "bg-[#F1F6F9] text-[#222526]"
                  : "text-[#69737C] hover:bg-[#F1F6F9]"
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNext}
          aria-label="Next page"
          className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-[#69737C] hover:bg-[#F1F6F9] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
