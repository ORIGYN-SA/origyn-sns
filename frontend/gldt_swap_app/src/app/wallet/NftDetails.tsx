import { useEffect, useState } from "react";

import { Close } from "../icons";
import type { Collection } from "../icp/canisters";
import { useNftMeta } from "./nftMeta";
import { nftName } from "./rows";

/** A picture of the bar at full size, over a dark backdrop. */
const ImageViewer = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => (
  <div className="w-iv" onClick={onClose}>
    <button type="button" className="w-ivx" aria-label="Close" onClick={onClose}>
      <Close width={24} height={24} />
    </button>
    <div className="w-ivc">
      <div className="w-ivb" onClick={(e) => e.stopPropagation()}>
        <img className="w-ivi" src={src} alt={alt} />
      </div>
    </div>
  </div>
);

/** One GLD NFT: its bar's serial number, pictures and gold specifications. It fades in and out. */
export const NftDetails = ({ c, id, onClose }: { c: Collection; id: bigint; onClose: () => void }) => {
  const meta = useNftMeta(c, id).data;
  const [out, setOut] = useState(false);
  const [view, setView] = useState<{ src: string; alt: string } | null>(null);
  const name = nftName(c, id);
  const close = () => setOut(true);
  useEffect(() => {
    if (!out) return;
    const t = setTimeout(onClose, 300);
    return () => clearTimeout(t);
  }, [out, onClose]);
  const front = meta?.front ?? c.img;
  const back = meta?.back ?? c.img;
  const field = (label: string, value: string) => (
    <div>
      <div className="w-fl">{label}</div>
      <div className="w-fv">{value}</div>
    </div>
  );
  return (
    <>
      <div className={`d2 ${out ? "out" : ""}`}>
        <div className="d2b" />
        <div className="d1p" onClick={close}>
          <div className="dlg2" role="dialog" aria-modal="true" aria-label={name} onClick={(e) => e.stopPropagation()}>
            <div className="d2close">
              <button type="button" className="ib" aria-label="Close" onClick={close}>
                <Close width={18} height={18} />
              </button>
            </div>
            <div className="w-f1 w-sy6">
              <h2 className="w-h2">{name}</h2>
              <div className="w-ndr">
                <div className="w-ndi">
                  <img className="w-ndimg" src={front} alt={name} onClick={() => setView({ src: front, alt: name })} />
                </div>
                <div className="w-f1">
                  <div className="w-fg">
                    {field("Name", name)}
                    {field("ID", String(id))}
                    {field("Serial Number", meta?.serial ?? "…")}
                    {field("Weight", c.weight)}
                  </div>
                  {meta?.description && (
                    <div className="w-mt16">
                      <div className="w-fl">Description</div>
                      <p className="c80">{meta.description}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-nsec">
                <h2 className="w-h2">Images</h2>
                <div className="w-fg">
                  <div>
                    <h3 className="w-ih">Front</h3>
                    <img className="w-thb" src={front} alt={`${name} Front`} onClick={() => setView({ src: front, alt: `${name} Front` })} />
                  </div>
                  <div>
                    <h3 className="w-ih">Back</h3>
                    <img className="w-thb" src={back} alt={`${name} Back`} onClick={() => setView({ src: back, alt: `${name} Back` })} />
                  </div>
                </div>
              </div>
              <div className="w-nsec">
                <h2 className="w-h2">Gold specifications</h2>
                <div className="w-fg">
                  {field("Weight", c.weight)}
                  {field("Fineness", meta?.fineness ?? "999.9")}
                  {field("Dimensions", meta?.dimensions ?? c.dimensions)}
                  {field("Hardness", meta?.hardness ?? c.hardness)}
                  {field("Manufacturer", meta?.manufacturer ?? "Metalor")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {view && <ImageViewer src={view.src} alt={view.alt} onClose={() => setView(null)} />}
    </>
  );
};
