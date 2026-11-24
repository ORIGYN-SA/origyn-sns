import { useState } from "react";

import { Chevron } from "../icons";
import type { Collection, CollectionKey } from "../icp/canisters";
import { useNftMeta } from "./nftMeta";

export type Selection = Record<CollectionKey, bigint[]>;

const Tile = ({ c, id, on, onToggle }: { c: Collection; id: bigint; on: boolean; onToggle: () => void }) => {
  const meta = useNftMeta(c, id);
  return (
    <button type="button" className={`tile ${on ? "on" : ""}`} aria-pressed={on} onClick={onToggle}>
      <div>
        <div className="f6 t14">Serial: {meta.data?.serial ?? "…"}</div>
        <div className="t12 c60">ID: {String(id)}</div>
      </div>
      <svg className={`w-ck ${on ? "on" : "o"}`} aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </button>
  );
};

/** One collection's NFTs to choose from, folded until opened. */
export const Picker = ({
  c,
  ids,
  selected,
  onChange,
}: {
  c: Collection;
  ids: bigint[] | null;
  selected: bigint[];
  onChange: (next: bigint[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const total = ids?.length ?? 0;
  return (
    <div className="w-pk">
      <button type="button" className="w-pkh" onClick={() => setOpen((o) => !o)}>
        <div className="w-pkhl">
          <img src={c.img} alt={c.label} />
          <div className="f6">{c.label}</div>
          <div className="t14 c60">
            ({ids ? selected.length : 0} / {total} selected)
          </div>
        </div>
        <Chevron className={`w-chv ${open ? "" : "rot180"}`} />
      </button>
      {open && ids === null && <div className="w-pkbox">Loading NFTs...</div>}
      {open && ids !== null && ids.length === 0 && <div className="w-pkbox e">No NFTs available in this collection</div>}
      {open && ids !== null && ids.length > 0 && (
        <>
          <div className="w-pka">
            {selected.length < ids.length && (
              <button type="button" className="w-pkb" onClick={() => onChange(ids.slice())}>
                Select All
              </button>
            )}
            {selected.length > 0 && (
              <button type="button" className="w-pkb" onClick={() => onChange([])}>
                Deselect All
              </button>
            )}
          </div>
          <div className="w-pkg">
            {ids.map((id) => {
              const on = selected.includes(id);
              return (
                <Tile
                  key={String(id)}
                  c={c}
                  id={id}
                  on={on}
                  onToggle={() => onChange(on ? selected.filter((x) => x !== id) : [...selected, id])}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

