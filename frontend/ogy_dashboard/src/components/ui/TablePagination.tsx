import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@components/ui/icons";
import { useT } from "@i18n/LocaleContext";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type PageItem = number | "ellipsis";

const buildPageItems = (pageIndex: number, pageCount: number): PageItem[] => {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
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
  const t = useT();
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;
  const pageItems = buildPageItems(pageIndex, pageCount);

  return (
    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-center gap-2 whitespace-nowrap text-muted sm:justify-start">
        <span className="shrink-0">{t("ui.linesPerPage")}</span>
        <div className="relative inline-flex shrink-0 items-center gap-[5px] rounded-full bg-surface-1 border border-border-strong py-[5px] px-[10px] font-medium text-[13px] leading-none text-content">
          <span>{pageSize}</span>
          <ChevronDownIcon className="pointer-events-none shrink-0" />
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
      <div className="flex items-center justify-center gap-1 sm:justify-end">
        {canPrev && (
          <button
            type="button"
            onClick={() => onPageChange(pageIndex - 1)}
            aria-label={t("ui.previousPage")}
            className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-muted hover:bg-surface-faint"
          >
            <ChevronLeftIcon className="rtl:-scale-x-100" />
          </button>
        )}
        {pageItems.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex items-center justify-center h-7 min-w-7 text-muted"
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
                  ? "bg-surface-faint text-content"
                  : "text-muted hover:bg-surface-faint"
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
          aria-label={t("ui.nextPage")}
          className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-muted hover:bg-surface-faint disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
