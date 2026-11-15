import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ITEMS, CUSTOM_PREFIX, CUSTOM_MAX_LEN, itemName } from "../content";
import { ItemIcon } from "./ItemIcon";

/** The drawn backpack illustration (also the drop target). */
function BigBackpack() {
  return (
    <svg className="bp-illus" viewBox="0 0 240 236" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="120" cy="216" rx="82" ry="13" fill="rgba(0,0,0,.13)" />
      <path d="M84 60 C 72 100, 72 160, 92 202" stroke="#a9773f" strokeWidth="11" />
      <path d="M156 60 C 168 100, 168 160, 148 202" stroke="#a9773f" strokeWidth="11" />
      <path d="M64 108 Q64 74 100 70 L140 70 Q176 74 176 108 L176 186 Q176 208 152 208 L88 208 Q64 208 64 186 Z" fill="#cf9a63" stroke="#4a3720" strokeWidth="4" />
      <path d="M106 72 Q106 54 120 54 Q134 54 134 72" stroke="#4a3720" strokeWidth="5" />
      <path d="M66 104 Q66 84 102 82 L138 82 Q174 84 174 104 L174 134 Q174 148 158 148 L82 148 Q66 148 66 134 Z" fill="#bd8850" stroke="#4a3720" strokeWidth="4" />
      <line x1="120" y1="130" x2="120" y2="140" stroke="#4a3720" strokeWidth="4" />
      <rect x="110" y="140" width="20" height="18" rx="4" fill="#9a6b38" stroke="#4a3720" strokeWidth="3" />
      <path d="M92 162 Q92 154 104 154 L136 154 Q148 154 148 162 L148 194 Q148 202 138 202 L102 202 Q92 202 92 194 Z" fill="#c9925a" stroke="#4a3720" strokeWidth="4" />
      <path d="M92 168 L148 168" stroke="#4a3720" strokeWidth="3" />
    </svg>
  );
}

function ItemCard({ id, dragging, onPointerDown }: { id: string; dragging?: boolean; onPointerDown?: (e: React.PointerEvent) => void }) {
  return (
    <div className={`bp-card ${dragging ? "is-dragging" : ""}`} onPointerDown={onPointerDown} data-item={id}>
      <ItemIcon id={id} />
      <span className="bp-name">{itemName(id)}</span>
    </div>
  );
}

type Drag = { id: string; from: "pool" | "pack"; x: number; y: number };

/** Drag pool cards onto the backpack (max N); drag packed ones off to remove. */
export function BackpackScene({
  packed, maxItems, onAdd, onRemove,
}: {
  packed: string[]; maxItems: number; onAdd: (id: string) => void; onRemove: (id: string) => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);
  const pool = ITEMS.filter((i) => !packed.includes(i.id));
  const full = packed.length >= maxItems;

  const addCustom = () => {
    const text = customText.trim();
    if (!text || full) return;
    onAdd(CUSTOM_PREFIX + text);
    setCustomText("");
    setCustomOpen(false);
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    const up = (e: PointerEvent) => {
      const r = dropRef.current?.getBoundingClientRect();
      const over = !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (drag.from === "pool" && over && !full && !packed.includes(drag.id)) onAdd(drag.id);
      if (drag.from === "pack" && !over) onRemove(drag.id);
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag, full, packed, onAdd, onRemove]);

  const start = (id: string, from: "pool" | "pack") => (e: React.PointerEvent) => {
    e.preventDefault();
    setDrag({ id, from, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="bp-scene">
      <div className="bp-ground" />
      <div className="bp-center">
        <div className={`bp-drop ${drag?.from === "pool" && !full ? "armed" : ""}`} ref={dropRef} data-drop="backpack">
          <BigBackpack />
          <div className="bp-slots">
            {Array.from({ length: maxItems }).map((_, i) => {
              const id = packed[i];
              return id ? (
                <button key={id} className="bp-slot filled" onPointerDown={start(id, "pack")} title="Drag out to remove">
                  <ItemIcon id={id} size={30} />
                </button>
              ) : (
                <span key={`e${i}`} className="bp-slot empty">+</span>
              );
            })}
          </div>
        </div>
        <p className="bp-count">{packed.length} of {maxItems} packed{full ? " — drag one out to swap" : ""}</p>
      </div>
      <div className="bp-tray">
        {pool.map((it) => (
          <ItemCard key={it.id} id={it.id} dragging={drag?.id === it.id} onPointerDown={start(it.id, "pool")} />
        ))}
        <button type="button" className="bp-card bp-card-add"
          onClick={() => !full && setCustomOpen((o) => !o)} disabled={full}
          title={full ? "Backpack is full" : "Add your own"}>
          <ItemIcon id={CUSTOM_PREFIX} />
          <span className="bp-name">Something else</span>
        </button>
      </div>

      {customOpen && !full && (
        <div className="bp-custom-row">
          <input className="bp-custom-input" autoFocus maxLength={CUSTOM_MAX_LEN} value={customText}
            placeholder="Name your own item…"
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCustom(); if (e.key === "Escape") { setCustomOpen(false); setCustomText(""); } }} />
          <button type="button" className="tg-btn" onClick={addCustom} disabled={!customText.trim()}>Add to backpack</button>
          <button type="button" className="tg-btn ghost" onClick={() => { setCustomOpen(false); setCustomText(""); }}>Cancel</button>
        </div>
      )}

      {/* Rendered straight into <body> so it always sits under the pointer,
          whatever transforms or animations the surrounding layout has. */}
      {drag && createPortal(
        <div className="bp-ghost" style={{ left: drag.x, top: drag.y }}>
          <ItemCard id={drag.id} />
        </div>,
        document.body,
      )}
    </div>
  );
}

/** Read-only view of a packed backpack. */
export function BackpackView({ title, items, maxItems }: { title: string; items: string[]; maxItems: number }) {
  return (
    <div className="bp-view">
      <div className="bp-view-title">{title}</div>
      <div className="bp-view-items">
        {Array.from({ length: maxItems }).map((_, i) => {
          const id = items[i];
          return (
            <div key={i} className={`bp-view-item ${id ? "" : "empty"}`}>
              {id ? <ItemIcon id={id} size={34} /> : <span className="bp-view-dash">—</span>}
              <span className="bp-view-name">{id ? itemName(id) : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
