import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEMO_TITLE, AUTHOR, YOU, PEERS, PERSONA_NAME,
  REFLECT, PEER_REFLECT_PICKS, BACKPACK_QUESTION, MAX_ITEMS, PEER_BACKPACKS,
  PERSONA_QUESTIONS, PERSONA_MORE, PEER_PERSONA, DISCUSSION,
  PRIORITY_QUESTION, PRIORITY_CARDS, GROUP_LABEL, GROUPS, NOTES, itemName, type Group,
} from "./content";
import { Head, Note, Roster, Reveal, PersonaCard, CompareBoard, DiscussCard, Pips } from "./components/parts";
import { BackpackScene, BackpackView } from "./components/Backpack";
import { SortStage, PriorityOverview } from "./components/Sort";
import { printHtml, esc } from "./print";
import { sleep, waitFor, click, fly, moveTo, hideCursor } from "./autoplay";

// ---------------------------------------------------------------------------
// The tour, in order. Each step is one screen.
// ---------------------------------------------------------------------------
const STEPS = [
  "intro", "answer", "reveal", "backpack", "backpacks", "persona1", "persona2",
  "agree", "card", "discuss", "reflectPersona", "compare", "prioritise", "end",
] as const;
type Step = (typeof STEPS)[number];

/** Short subtitles for the self-playing video mode. */
const CAPTIONS: Record<Step, string> = {
  intro: "Workshop tools for distributed learning teams",
  answer: "Everyone answers privately first …",
  reveal: "… then all answers are revealed together.",
  backpack: "A workshop metaphor, kept intact: pack your backpack.",
  backpacks: "Compare what the group packed.",
  persona1: "Build a learner persona, one question at a time.",
  persona2: "Twelve questions in the full version.",
  agree: "The group agrees on one persona, field by field.",
  card: "The persona becomes the shared reference.",
  discuss: "A pause for discussion — nothing to fill in.",
  reflectPersona: "The same question, now from the persona’s view.",
  compare: "Your answer next to the persona’s.",
  prioritise: "Prioritise learning formats for the persona.",
  end: "Results leave the session as a PDF. Nothing is stored.",
};

const params = new URLSearchParams(window.location.search);
const AUTOPLAY = params.get("autoplay") === "1";
const EMBEDDED = (() => { try { return window.self !== window.top; } catch { return true; } })();

// ?jump=<step> opens a single screen with sample answers (for screenshots).
const JUMP = (STEPS as readonly string[]).includes(params.get("jump") ?? "") ? (params.get("jump") as Step) : null;
const SAMPLE = JUMP !== null;

// Simulated colleagues lock in their answer after a moment of "thinking".
const PEER_DELAYS = [1800, 3200];

const mostCommon = (lists: number[][], max: number): number[] => {
  const count = new Map<number, number>();
  lists.flat().forEach((i) => count.set(i, (count.get(i) ?? 0) + 1));
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, max).map(([i]) => i);
};

export default function App() {
  const [step, setStep] = useState<Step>(JUMP ?? "intro");
  const [notes, setNotes] = useState(!AUTOPLAY && params.get("notes") !== "0");

  // Visitor's answers (pre-filled with sample answers when jumping to a step)
  const [selfPick, setSelfPick] = useState<number | null>(SAMPLE ? 0 : null);
  const [locked, setLocked] = useState(SAMPLE);
  const [peersDone, setPeersDone] = useState<boolean[]>([SAMPLE, SAMPLE]);
  const [packed, setPacked] = useState<string[]>(SAMPLE ? ["map", "star", "clock"] : []);
  const [persona, setPersona] = useState<Record<string, number[]>>(SAMPLE ? { role: [2, 1], setting: [3] } : { role: [], setting: [] });
  const [agreed, setAgreed] = useState<number[]>(SAMPLE ? [2, 1] : []);
  const [agreedOther, setAgreedOther] = useState("");
  const [personaPick, setPersonaPick] = useState<number | null>(SAMPLE ? 4 : null);
  const [placed, setPlaced] = useState<Record<string, Group>>(
    SAMPLE && JUMP === "end" ? { elearning: "maybe", workshop: "yes", circle: "yes", jobaid: "no" } : {});

  const idx = STEPS.indexOf(step);
  const go = useCallback((s: Step) => { setStep(s); window.scrollTo({ top: 0 }); }, []);
  const next = useCallback(() => go(STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]), [go, step]);
  const back = useCallback(() => go(STEPS[Math.max(STEPS.indexOf(step) - 1, 0)]), [go, step]);

  const restart = () => {
    setSelfPick(null); setLocked(false); setPeersDone([false, false]); setPacked([]);
    setPersona({ role: [], setting: [] }); setAgreed([]); setAgreedOther(""); setPersonaPick(null); setPlaced({});
    go("intro");
  };

  // Colleagues "think" and lock in while the visitor is on the answer screen.
  useEffect(() => {
    if (step !== "answer") return;
    const timers = PEER_DELAYS.map((ms, i) =>
      setTimeout(() => setPeersDone((d) => d.map((v, k) => (k === i ? true : v))), ms));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Theme override for recordings: ?theme=dark / ?theme=light
  useEffect(() => {
    const t = params.get("theme");
    if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
  }, []);

  // ----- derived values -----
  const allLocked = locked && peersDone.every(Boolean);
  const people = [YOU, ...PEERS];
  const selfPicks = [
    { name: YOU, index: selfPick ?? 0 },
    ...PEERS.map((p) => ({ name: p, index: PEER_REFLECT_PICKS[p] })),
  ];
  const roleQ = PERSONA_QUESTIONS[0];
  const settingQ = PERSONA_QUESTIONS[1];
  const contributions = useMemo(() => {
    // option index -> names of the people who picked it for "role"
    const by = new Map<number, string[]>();
    const add = (name: string, picks: number[]) => picks.forEach((i) => by.set(i, [...(by.get(i) ?? []), name]));
    add(YOU, persona.role);
    PEERS.forEach((p) => add(p, PEER_PERSONA[p].role));
    return [...by.entries()].sort((a, b) => b[1].length - a[1].length || a[0] - b[0]);
  }, [persona.role]);
  const roleValue = [...agreed.map((i) => roleQ.options[i]), ...(agreedOther.trim() ? [agreedOther.trim()] : [])].join(" · ");
  const settingValue = mostCommon([persona.setting, ...PEERS.map((p) => PEER_PERSONA[p].setting)], 2)
    .map((i) => settingQ.options[i]).join(" · ");
  const sortedAll = Object.keys(placed).length === PRIORITY_CARDS.length;

  const togglePersona = (key: string, i: number, max: number) =>
    setPersona((p) => {
      const cur = p[key];
      const nextSel = cur.includes(i) ? cur.filter((x) => x !== i) : cur.length >= max ? cur : [...cur, i];
      return { ...p, [key]: nextSel };
    });
  const toggleAgreed = (i: number) =>
    setAgreed((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : cur.length >= roleQ.maxSelect ? cur : [...cur, i]));

  const addItem = useCallback((id: string) => setPacked((p) => (p.length >= MAX_ITEMS || p.includes(id) ? p : [...p, id])), []);
  const removeItem = useCallback((id: string) => setPacked((p) => p.filter((x) => x !== id)), []);
  const assign = useCallback((id: string, g: Group) => setPlaced((p) => ({ ...p, [id]: g })), []);

  // ----- PDF of the visitor's session -----
  const savePdf = () => {
    const reflectRows = [
      [YOU, REFLECT.options[selfPick ?? 0]],
      ...PEERS.map((p) => [p, REFLECT.options[PEER_REFLECT_PICKS[p]]]),
      [`${PERSONA_NAME} (persona)`, REFLECT.options[personaPick ?? 0]],
    ];
    const bp = (title: string, items: string[]) =>
      `<div class="bp"><b>${esc(title)}</b>${items.map((i) => esc(itemName(i))).join("<br>") || "—"}</div>`;
    const col = (g: Group) => {
      const items = PRIORITY_CARDS.filter((c) => placed[c.id] === g);
      return `<div class="col ${g}"><h3>${GROUP_LABEL[g]}</h3><ul>${items.map((c) => `<li>${esc(c.name)}</li>`).join("") || "<li>—</li>"}</ul></div>`;
    };
    printHtml("Workshop Tools — demo session", `
      <p class="k">Workshop Tools · demo session</p>
      <h1>Learning persona: ${esc(PERSONA_NAME)}</h1>
      <p class="sub">A short session with two simulated colleagues, ${esc(PEERS.join(" and "))}.</p>
      <table><tbody>
        <tr><td class="q">${esc(roleQ.label)}</td><td>${esc(roleValue || "—")}</td></tr>
        <tr><td class="q">${esc(settingQ.label)}</td><td>${esc(settingValue || "—")}</td></tr>
        ${PERSONA_MORE.slice(0, 3).map((l) => `<tr><td class="q">${esc(l)}</td><td class="ghost">… full version</td></tr>`).join("")}
      </tbody></table>
      <p class="k">Reflection</p>
      <h2>${esc(REFLECT.topicNeutral)}</h2>
      <table><thead><tr><th>Who</th><th>Answer</th></tr></thead><tbody>
        ${reflectRows.map(([w, a]) => `<tr><td class="q">${esc(w)}</td><td>${esc(a)}</td></tr>`).join("")}
      </tbody></table>
      <p class="k">Backpacks</p>
      <div class="bps">${bp(YOU, packed)}${PEERS.map((p) => bp(p, PEER_BACKPACKS[p])).join("")}</div>
      <p class="k">Priorities for ${esc(PERSONA_NAME)}</p>
      <div class="cols">${GROUPS.map(col).join("")}</div>
      <p class="foot">Generated by the Workshop Tools demo · ${esc(new Date().toLocaleString())} · Content generalised for demonstration.</p>
    `);
  };

  // ----- the self-playing tour (video mode) -----
  const ap = useRef({ next, assign, addItem, setSelfPick, setLocked, togglePersona, toggleAgreed, setPersonaPick });
  ap.current = { next, assign, addItem, setSelfPick, setLocked, togglePersona, toggleAgreed, setPersonaPick };
  useEffect(() => {
    if (!AUTOPLAY) return;
    let alive = true;
    const run = async () => {
      const $ = (sel: string) => waitFor(sel);
      const advance = async () => { await click(await $("[data-next]")); ap.current.next(); await sleep(650); };
      const hold = (ms: number) => sleep(ms);
      try {
        await hold(2600); await advance();                                            // intro
        await hold(900);
        await click(await $('[data-opt="0"]')); ap.current.setSelfPick(0); await hold(500);
        await click(await $("[data-lock]")); ap.current.setLocked(true);
        await waitFor("[data-reveal]:not([disabled])", 6000); await hold(400);
        await click(await $("[data-reveal]")); ap.current.next(); await hold(3200);   // answer → reveal
        await advance();
        for (const id of ["map", "star", "clock"]) {                                   // backpack
          await fly(await $(`[data-item="${id}"]`), await $('[data-drop="backpack"]'));
          ap.current.addItem(id); await hold(250);
        }
        await hold(900); await advance();
        await hold(2800); await advance();                                            // group backpacks
        await click(await $('[data-opt="2"]')); ap.current.togglePersona("role", 2, 2); await hold(350);
        await click(await $('[data-opt="1"]')); ap.current.togglePersona("role", 1, 2); await hold(600);
        await advance();                                                              // persona 1
        await click(await $('[data-opt="3"]')); ap.current.togglePersona("setting", 3, 2); await hold(900);
        await advance();                                                              // persona 2
        await hold(1800);
        await click(await $('[data-agree="2"]')); ap.current.toggleAgreed(2); await hold(400);
        await click(await $('[data-agree="1"]')); ap.current.toggleAgreed(1); await hold(1100);
        await advance();                                                              // agree
        await hold(3200); await advance();                                            // card
        await hold(2800); await advance();                                            // discuss
        await click(await $('[data-opt="4"]')); ap.current.setPersonaPick(4); await hold(800);
        await advance();                                                              // reflect as persona
        await hold(3400); await advance();                                            // compare
        const plan: [string, Group][] = [["elearning", "maybe"], ["workshop", "yes"], ["circle", "yes"], ["jobaid", "no"]];
        for (const [id, g] of plan) {                                                 // prioritise
          await fly(await $(`[data-card="${id}"]`), await $(`[data-zone="${g}"]`), 650);
          ap.current.assign(id, g); await hold(350);
        }
        await hold(2200); await advance();
        await moveTo(await $("[data-pdf]")); await hold(4000);                        // end
        hideCursor();
      } catch (e) {
        console.warn(e);
      }
      if (!alive) hideCursor();
    };
    run();
    return () => { alive = false; };
  }, []);

  // ----- screens -----
  const nav = (label = "Next →", disabled = false) => (
    <div className="tg-controls">
      <div className="buttons">
        {idx > 1 && <button className="tg-btn ghost" onClick={back}>← Back</button>}
        <button className="tg-btn" onClick={next} disabled={disabled} data-next>{label}</button>
      </div>
    </div>
  );

  let screen: JSX.Element;
  switch (step) {
    case "intro":
      screen = (
        <div className="demo-intro">
          <span className="tg-eyebrow">Interactive demo · about 3 minutes</span>
          <h1 className="demo-intro-title tg-serif">Workshop tools for distributed learning teams</h1>
          <p className="tg-lede">
            Small web apps that bring in-person workshop exercises to teams spread across locations.
            A facilitator opens a session, everyone joins on their own device, and the whole group
            sees the same thing live while they talk.
          </p>
          <p className="demo-intro-body">
            This tour plays one short round of each step. Two simulated colleagues, <strong>Lena</strong> and{" "}
            <strong>Sam</strong>, play along so that the group features make sense when you visit on your own.
          </p>
          <div style={{ marginTop: "1.8rem" }}>
            <button className="tg-btn" onClick={next} data-next>Start the tour →</button>
          </div>
          <p className="demo-fineprint">All content in this demo has been generalised for demonstration purposes.</p>
        </div>
      );
      break;

    case "answer":
      screen = (
        <>
          <Head eyebrow="Reflection · as yourself" title={REFLECT.topicSelf} standing={REFLECT.framing} />
          <div className="tg-options demo-3col">
            {REFLECT.options.map((o, i) => (
              <button key={i} className={`tg-opt-card ${selfPick === i ? "sel" : ""} ${locked ? "locked" : ""}`}
                onClick={() => !locked && setSelfPick(i)} data-opt={i}>{o}</button>
            ))}
          </div>
          <div className="tg-controls" style={{ justifyContent: "space-between" }}>
            <Roster people={[{ name: YOU, done: locked }, ...PEERS.map((p, i) => ({ name: p, done: peersDone[i] }))]} />
            <div className="buttons">
              {!locked ? (
                <button className="tg-btn" disabled={selfPick === null} onClick={() => setLocked(true)} data-lock>Lock in my choice</button>
              ) : (
                <button className="tg-btn" disabled={!allLocked} onClick={next} data-reveal>
                  {allLocked ? "Reveal answers →" : "Waiting for the others…"}
                </button>
              )}
            </div>
          </div>
          <Note show={notes}>{NOTES.answer}</Note>
        </>
      );
      break;

    case "reveal":
      screen = (
        <>
          <div className="tg-round-line"><span className="tg-eyebrow">Reflection · revealed</span></div>
          <Reveal topic={REFLECT.topicSelf} options={REFLECT.options} picks={selfPicks} />
          {nav()}
          <Note show={notes}>{NOTES.reveal}</Note>
        </>
      );
      break;

    case "backpack":
      screen = (
        <>
          <Head eyebrow="Your own backpack" title={BACKPACK_QUESTION} />
          <BackpackScene packed={packed} maxItems={MAX_ITEMS} onAdd={addItem} onRemove={removeItem} />
          {nav(packed.length < MAX_ITEMS ? `Pack ${MAX_ITEMS - packed.length} more` : "Next →", packed.length < MAX_ITEMS)}
          <Note show={notes}>{NOTES.backpack}</Note>
        </>
      );
      break;

    case "backpacks":
      screen = (
        <>
          <Head eyebrow="Everyone’s backpacks, side by side" title="What the group packed" />
          <div className="bp-compare">
            <BackpackView title={YOU} items={packed} maxItems={MAX_ITEMS} />
            {PEERS.map((p) => <BackpackView key={p} title={p} items={PEER_BACKPACKS[p]} maxItems={MAX_ITEMS} />)}
          </div>
          {nav()}
        </>
      );
      break;

    case "persona1":
    case "persona2": {
      const q = step === "persona1" ? roleQ : settingQ;
      const sel = persona[q.key];
      const full = sel.length >= q.maxSelect;
      screen = (
        <>
          <Head eyebrow={`Learning persona · question ${step === "persona1" ? 1 : 2} of 12 · ${q.label}`} title={q.prompt}
            standing={<>Select up to {q.maxSelect}.</>} />
          <div className="tg-options demo-3col">
            {q.options.map((o, i) => {
              const on = sel.includes(i);
              return (
                <button key={i} className={`tg-opt-card ${on ? "sel" : ""} ${!on && full ? "pick-full" : ""}`}
                  onClick={() => togglePersona(q.key, i, q.maxSelect)} data-opt={i}>{o}</button>
              );
            })}
          </div>
          {step === "persona2" && (
            <div className="demo-more">
              <span className="demo-more-dots">…</span>
              <span>In the full version, ten more questions follow: {PERSONA_MORE.slice(0, 5).join(", ").toLowerCase()} and more.</span>
            </div>
          )}
          {nav(step === "persona2" ? "Skip ahead to the group →" : "Next →", sel.length === 0)}
          <Note show={notes}>{NOTES.persona}</Note>
        </>
      );
      break;
    }

    case "agree": {
      const given = new Set(contributions.map(([i]) => i));
      const rest = roleQ.options.map((_, i) => i).filter((i) => !given.has(i));
      const full = agreed.length >= roleQ.maxSelect;
      screen = (
        <>
          <Head eyebrow={`Agree together · ${roleQ.label}`} title={roleQ.prompt}
            standing={<>Everyone built their own persona. Now agree on up to {roleQ.maxSelect} — you hold the pen.</>} />
          <div className="tg-options">
            {contributions.map(([i, names]) => {
              const on = agreed.includes(i);
              return (
                <button key={i} className={`tg-opt-card pd-card ${on ? "sel" : ""} ${!on && full ? "pick-full" : ""}`}
                  onClick={() => toggleAgreed(i)} data-agree={i}>
                  <span className="pd-val">{roleQ.options[i]}</span>
                  <span className="pd-who">{names.join(", ")}</span>
                </button>
              );
            })}
          </div>
          {rest.length > 0 && (
            <>
              <div className="tg-section-label" style={{ margin: "1.4rem 0 .8rem" }}>
                <span className="tg-eyebrow" style={{ color: "var(--tg-ink-soft)" }}>Not picked by anyone — still open</span>
              </div>
              <div className="tg-options pd-rest-grid">
                {rest.map((i) => {
                  const on = agreed.includes(i);
                  return (
                    <button key={i} className={`tg-opt-card pd-card pd-rest ${on ? "sel" : ""} ${!on && full ? "pick-full" : ""}`}
                      onClick={() => toggleAgreed(i)} data-agree={i}>
                      <span className="pd-val">{roleQ.options[i]}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="tg-field" style={{ marginTop: "1.1rem", maxWidth: "34rem" }}>
            <label className="tg-label" htmlFor="other">Other — a combined answer</label>
            <input id="other" className="tg-input" placeholder="Type a combined answer…" maxLength={80}
              value={agreedOther} onChange={(e) => setAgreedOther(e.target.value)} />
          </div>
          <div className="demo-more">
            <span className="demo-more-dots">…</span>
            <span>The group continues like this for every field of the persona.</span>
          </div>
          {nav("See the persona →", agreed.length === 0 && !agreedOther.trim())}
          <Note show={notes}>{NOTES.agree}</Note>
        </>
      );
      break;
    }

    case "card":
      screen = (
        <>
          <Head eyebrow="Meet your learning persona" title={PERSONA_NAME}
            standing={<>Fields marked “…” are filled in during the full session.</>} />
          <PersonaCard name={PERSONA_NAME}
            filled={[{ label: roleQ.label, value: roleValue || "—" }, { label: settingQ.label, value: settingValue || "—" }]}
            more={PERSONA_MORE.slice(0, 6)} />
          {nav()}
          <Note show={notes}>{NOTES.card}</Note>
        </>
      );
      break;

    case "discuss":
      screen = (
        <>
          <DiscussCard eyebrow={`Discuss together · ${PERSONA_NAME}`} question={DISCUSSION} />
          {nav()}
          <Note show={notes}>{NOTES.discuss}</Note>
        </>
      );
      break;

    case "reflectPersona":
      screen = (
        <>
          <Head eyebrow={`Reflection · as ${PERSONA_NAME}`} title={REFLECT.topicPersona} />
          <div className="tg-options demo-3col">
            {REFLECT.options.map((o, i) => (
              <button key={i} className={`tg-opt-card ${personaPick === i ? "sel" : ""}`}
                onClick={() => setPersonaPick(i)} data-opt={i}>{o}</button>
            ))}
          </div>
          {nav("Compare →", personaPick === null)}
          <Note show={notes}>{NOTES.reflectPersona}</Note>
        </>
      );
      break;

    case "compare":
      screen = (
        <>
          <Head eyebrow={`Everyone ↔ ${PERSONA_NAME}`} title="How the answers compare" />
          <CompareBoard question={REFLECT.topicNeutral} moreRows={2} cells={[
            { who: YOU, answer: REFLECT.options[selfPick ?? 0] },
            ...PEERS.map((p) => ({ who: p, answer: REFLECT.options[PEER_REFLECT_PICKS[p]] })),
            { who: PERSONA_NAME, answer: REFLECT.options[personaPick ?? 0], persona: true },
          ]} />
          {nav()}
          <Note show={notes}>{NOTES.compare}</Note>
        </>
      );
      break;

    case "prioritise":
      screen = (
        <>
          <Head eyebrow="Prioritization" title={PRIORITY_QUESTION}
            standing={sortedAll ? <>All sorted. The full version works with a deck of 24 formats.</> : <>Drag the card onto a pile — or click a pile.</>} />
          {sortedAll ? <PriorityOverview placed={placed} /> : <SortStage placed={placed} onAssign={assign} />}
          {nav("Finish →", !sortedAll)}
          <Note show={notes}>{NOTES.prioritise}</Note>
        </>
      );
      break;

    case "end":
      screen = (
        <div className="demo-end">
          <span className="tg-eyebrow">That’s the tour</span>
          <h1 className="tg-topic">Everything the session produced, in one document</h1>
          <p className="tg-standing" style={{ marginBottom: "1.4rem" }}>{NOTES.export}</p>
          <div className="buttons" style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
            <button className="tg-btn" onClick={savePdf} data-pdf>Save this session as PDF</button>
            <button className="tg-btn ghost" onClick={restart}>Restart the tour</button>
          </div>
          <div className="demo-facts">
            <h2 className="tg-serif">What you just saw — and what the full tools add</h2>
            <ul>
              <li><strong>In real use</strong> with the learning team of an international organisation, in sessions of up to six people.</li>
              <li><strong>Individual and group versions</strong>, each with a separate facilitator view to start, steer and skip steps.</li>
              <li><strong>Every step at full length</strong>: three reflection questions, twelve persona fields, a deck of 24 formats.</li>
              <li><strong>A bilingual English/French edition</strong> of a third tool, a card game on psychological safety.</li>
              <li><strong>No data stored</strong> — results leave the session as a PDF.</li>
            </ul>
          </div>
          <p className="demo-fineprint">Concept and design: {AUTHOR} · Content generalised for demonstration.</p>
        </div>
      );
      break;
  }

  return (
    <div className={`tg-app ${AUTOPLAY ? "demo-autoplay" : ""} ${EMBEDDED ? "demo-embedded" : ""}`}>
      <div className="tg-wrap">
        <div className="tg-bar">
          <div>
            <div className="brand">{DEMO_TITLE}</div>
            <div className="role">Interactive demo</div>
          </div>
          <div className="tg-bar-right">
            {idx > 0 && <Pips step={idx} total={STEPS.length - 1} />}
            {!AUTOPLAY && (
              <>
                <button className={`demo-toggle ${notes ? "on" : ""}`} onClick={() => setNotes((n) => !n)} aria-pressed={notes}>
                  Notes {notes ? "on" : "off"}
                </button>
                {idx > 0 && <button className="demo-toggle" onClick={restart}>Restart</button>}
              </>
            )}
          </div>
        </div>
        <main key={step} className="demo-step">{screen}</main>
      </div>
      {AUTOPLAY && <div className={`demo-caption ${step === "end" ? "fade-out" : ""}`} key={`c-${step}`}>{CAPTIONS[step]}</div>}
      {/* people list kept for screen readers announcing the simulated group */}
      <span className="sr-only">Playing with {people.length - 1} simulated colleagues.</span>
    </div>
  );
}
