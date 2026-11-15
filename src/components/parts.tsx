import type { ReactNode } from "react";

export function Avatar({ name, index }: { name: string; index: number }) {
  return <span className={`av v${index % 3}`} aria-hidden="true">{(name.trim()[0] ?? "?").toUpperCase()}</span>;
}

/** "Why it works this way" — the design rationale shown under each step. */
export function Note({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <aside className="demo-note">
      <span className="demo-note-k">Why it works this way</span>
      <p>{children}</p>
    </aside>
  );
}

/** Page heading used on every step. */
export function Head({ eyebrow, title, standing }: { eyebrow: string; title: string; standing?: ReactNode }) {
  return (
    <>
      <div className="tg-round-line"><span className="tg-eyebrow">{eyebrow}</span></div>
      <h1 className="tg-topic">{title}</h1>
      {standing && <p className="tg-standing" style={{ marginBottom: "1.2rem" }}>{standing}</p>}
    </>
  );
}

/** Who has locked in their answer: ✓ or still thinking. */
export function Roster({ people }: { people: { name: string; done: boolean }[] }) {
  return (
    <div className="tg-roster">
      {people.map((p, i) => (
        <span key={p.name} className={`tg-pchip ${p.done ? "done" : ""}`}>
          <Avatar name={p.name} index={i} />
          {p.name}
          <span className="state" title={p.done ? "Locked in" : "Still choosing"}>{p.done ? "✓" : "…"}</span>
        </span>
      ))}
    </div>
  );
}

/** Every option with the people who chose it; chosen options rise to the top. */
export function Reveal({ topic, options, picks }: {
  topic: string; options: string[]; picks: { name: string; index: number }[];
}) {
  const people = picks.map((p) => p.name);
  return (
    <div>
      <div className="tg-reveal-head">
        <h2 className="tg-serif">{topic}</h2>
        <span className="tg-count">{picks.length} of {picks.length} chosen</span>
      </div>
      {options
        .map((opt, i) => ({ opt, i, who: picks.filter((p) => p.index === i) }))
        .sort((a, b) => (a.who.length ? 0 : 1) - (b.who.length ? 0 : 1))
        .map(({ opt, i, who }) => (
          <div key={i} className={`tg-opt ${who.length ? "hot" : "empty"} demo-pop`}>
            <span className="name">{opt}</span>
            <span className="tg-chips">
              {who.map((p) => (
                <span key={p.name} className="tg-chip">
                  <Avatar name={p.name} index={people.indexOf(p.name)} />
                  {p.name}
                </span>
              ))}
            </span>
          </div>
        ))}
    </div>
  );
}

function AvatarHead() {
  return (
    <div className="lp-avatar">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="37" r="20" fill="var(--lp-avatar-fill)" />
        <path d="M18 90 C18 68 34 60 50 60 C66 60 82 68 82 90 Z" fill="var(--lp-avatar-fill)" />
      </svg>
    </div>
  );
}

/** The persona card: filled fields in colour, the rest of the full version as placeholders. */
export function PersonaCard({ name, filled, more }: {
  name: string; filled: { label: string; value: string }[]; more: string[];
}) {
  const cards = [
    ...filled.map((f, i) => ({ ...f, ghost: false, color: `lp-c${(i % 7) + 1}` })),
    ...more.map((label, i) => ({ label, value: "…", ghost: true, color: `lp-c${((i + filled.length) % 7) + 1}` })),
  ];
  const half = Math.ceil(cards.length / 2);
  const card = (c: (typeof cards)[number], k: number) => (
    <div className={`lp-card ${c.color} ${c.ghost ? "ghost" : ""}`} key={k}>
      <span className="lp-k">{c.label}</span>
      <span className="lp-v">{c.value}</span>
    </div>
  );
  return (
    <div className="lp-overview">
      <div className="lp-layout">
        <div className="lp-col">{cards.slice(0, half).map(card)}</div>
        <div className="lp-avatar-block">
          <AvatarHead />
          <span className="tg-eyebrow" style={{ marginTop: "1rem" }}>Learning persona</span>
          <p className="lp-name tg-serif">{name}</p>
        </div>
        <div className="lp-col">{cards.slice(half).map(card)}</div>
      </div>
    </div>
  );
}

/** One question across everyone plus the persona; further rows hinted. */
export function CompareBoard({ question, cells, moreRows }: {
  question: string; cells: { who: string; answer: string; persona?: boolean }[]; moreRows: number;
}) {
  return (
    <div className="tg-board">
      <div className="tg-board-row">
        <div className="tg-board-qlabel">{question}</div>
        <div className="tg-board-cells">
          {cells.map((c, i) => (
            <div key={c.who} className={`tg-board-cell ${c.persona ? "col-persona" : `col${i % 3}`}`}>
              <span className="who">{c.who}</span>
              <span className="ans tg-serif">{c.answer}</span>
            </div>
          ))}
        </div>
      </div>
      {moreRows > 0 && (
        <div className="tg-board-row demo-ghost-row">
          <div className="tg-board-qlabel">… {moreRows} more questions</div>
          <div className="tg-board-cells"><span className="demo-ghost-text">in the full version, every question is compared the same way</span></div>
        </div>
      )}
    </div>
  );
}

export function DiscussCard({ eyebrow, question }: { eyebrow: string; question: string }) {
  return (
    <div className="tg-discuss">
      <span className="tg-eyebrow">{eyebrow}</span>
      <p className="tg-discuss-q">{question}</p>
    </div>
  );
}

export function Pips({ step, total }: { step: number; total: number }) {
  return (
    <span className="tg-pips" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => <span key={i} className={`tg-pip ${i < step ? "on" : ""}`} />)}
    </span>
  );
}
