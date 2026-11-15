import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GROUPS, GROUP_LABEL, GROUP_DESC, PRIORITY_CARDS, type Group, type PriorityCard } from "../content";

export function CardTile({ card, dragging, small, onPointerDown }: {
  card: PriorityCard; dragging?: boolean; small?: boolean; onPointerDown?: (e: React.PointerEvent) => void;
}) {
  return (
    <div className={`pr-card ${dragging ? "is-dragging" : ""} ${small ? "small" : ""}`} onPointerDown={onPointerDown} data-card={card.id}>
      <span className="pr-card-name">{card.name}</span>
      <span className="pr-card-desc">{card.description}</span>
    </div>
  );
}

const byId = (id: string) => PRIORITY_CARDS.find((c) => c.id === id)!;

/** Drag the current card into Yes / Maybe / No — clicking a pile works too. */
export function SortStage({ placed, onAssign }: {
  placed: Record<string, Group>; onAssign: (cardId: string, group: Group) => void;
}) {
  const card = PRIORITY_CARDS.find((c) => !placed[c.id]) ?? null;
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const zoneRefs = useRef<Record<Group, HTMLDivElement | null>>({ yes: null, maybe: null, no: null });
  const sorted = Object.keys(placed).length;

  useEffect(() => {
    if (!drag || !card) return;
    const move = (e: PointerEvent) => setDrag((d) => (d ? { x: e.clientX, y: e.clientY } : d));
    const up = (e: PointerEvent) => {
      for (const g of GROUPS) {
        const r = zoneRefs.current[g]?.getBoundingClientRect();
        if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          onAssign(card.id, g);
          break;
        }
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag, card, onAssign]);

  const start = (e: React.PointerEvent) => { if (!card) return; e.preventDefault(); setDrag({ x: e.clientX, y: e.clientY }); };

  return (
    <div className="pr-stage">
      <p className="pr-progress">{sorted} of {PRIORITY_CARDS.length} sorted</p>
      <div className="pr-current">
        {card ? <CardTile card={card} dragging={!!drag} onPointerDown={start} /> : <p className="tg-standing">All cards sorted.</p>}
      </div>
      <div className="pr-zones">
        {GROUPS.map((g) => {
          const here = PRIORITY_CARDS.filter((c) => placed[c.id] === g);
          return (
            <div key={g} ref={(el) => (zoneRefs.current[g] = el)} data-zone={g}
              className={`pr-zone ${g} ${drag ? "armed" : ""}`}
              onClick={() => card && onAssign(card.id, g)}>
              <span className="pr-zone-label">{GROUP_LABEL[g]}</span>
              <span className="pr-zone-desc">{GROUP_DESC[g]}</span>
              {here.length > 0 && (
                <div className="pr-zone-placed">
                  {here.map((c) => <span key={c.id} className="pr-zone-chip">{c.name}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Rendered straight into <body> so it always sits under the pointer. */}
      {drag && card && createPortal(
        <div className="pr-ghost" style={{ left: drag.x, top: drag.y }}><CardTile card={card} /></div>,
        document.body,
      )}
    </div>
  );
}

/** The three piles, read-only. */
export function PriorityOverview({ placed }: { placed: Record<string, Group> }) {
  return (
    <div className="pr-overview readonly">
      {GROUPS.map((g) => {
        const here = Object.entries(placed).filter(([, grp]) => grp === g).map(([id]) => byId(id));
        return (
          <div key={g} className={`pr-col ${g}`}>
            <div className="pr-col-head">
              <div className="pr-col-head-top"><span>{GROUP_LABEL[g]}</span><span className="pr-col-count">{here.length}</span></div>
              <span className="pr-col-desc">{GROUP_DESC[g]}</span>
            </div>
            <div className="pr-col-cards">
              {here.length ? here.map((c) => <CardTile key={c.id} card={c} small />) : <p className="pr-col-empty">—</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
