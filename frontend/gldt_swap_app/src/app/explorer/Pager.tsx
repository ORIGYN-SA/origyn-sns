import { First, Last, Next, Prev } from "./icons";

/** First, previous, next and last page, and "Page n of m". */
export const Pager = ({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) => (
  <div className="ex-pgb">
    <button type="button" aria-label="First page" onClick={() => onPage(0)} disabled={page === 0}>
      <First />
    </button>
    <button type="button" aria-label="Previous page" onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0}>
      <Prev />
    </button>
    <button type="button" aria-label="Next page" onClick={() => onPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}>
      <Next />
    </button>
    <button type="button" aria-label="Last page" onClick={() => onPage(pages - 1)} disabled={page >= pages - 1}>
      <Last />
    </button>
    <span>
      Page {page + 1} of {pages}
    </span>
  </div>
);
