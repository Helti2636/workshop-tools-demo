// Helpers for the self-playing video mode (?autoplay=1): a visible cursor that
// glides to its target and "clicks", and cards that fly from A to B.

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Wait until an element matching the selector exists (the next step has rendered). */
export async function waitFor(selector: string, timeout = 4000): Promise<HTMLElement> {
  const t0 = performance.now();
  while (performance.now() - t0 < timeout) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
    await sleep(60);
  }
  throw new Error("autoplay: element not found: " + selector);
}

const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

let cursorEl: HTMLDivElement | null = null;

function cursor(): HTMLDivElement {
  if (cursorEl) return cursorEl;
  const el = document.createElement("div");
  el.className = "demo-cursor";
  el.innerHTML =
    '<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M3 2 L3 24 L9 18.5 L13.2 27.5 L17.2 25.6 L13 16.8 L21.5 16.8 Z" fill="#fff" stroke="#1d1712" stroke-width="2" stroke-linejoin="round"/></svg>';
  el.style.left = `${window.innerWidth * 0.62}px`;
  el.style.top = `${window.innerHeight * 0.72}px`;
  document.body.appendChild(el);
  cursorEl = el;
  return el;
}

/** Scroll the target into view if needed, then glide the cursor onto it. */
export async function moveTo(target: Element, ms = 650): Promise<void> {
  const r = target.getBoundingClientRect();
  if (r.top < 70 || r.bottom > window.innerHeight - 90) {
    // Scroll only this document. scrollIntoView would also scroll a page that
    // embeds the demo in an iframe, making the whole host page jump.
    const top = window.scrollY + r.top - (window.innerHeight - r.height) / 2;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    await sleep(450);
  }
  const c = cursor();
  const p = center(target);
  c.style.transition = `left ${ms}ms cubic-bezier(.45,.05,.25,1), top ${ms}ms cubic-bezier(.45,.05,.25,1)`;
  c.style.left = `${p.x}px`;
  c.style.top = `${p.y}px`;
  await sleep(ms + 60);
}

/** A small ripple where the cursor is, to read as a click in the recording. */
export async function tap(): Promise<void> {
  const c = cursor();
  const ripple = document.createElement("span");
  ripple.className = "demo-tap";
  ripple.style.left = c.style.left;
  ripple.style.top = c.style.top;
  document.body.appendChild(ripple);
  c.classList.add("down");
  await sleep(140);
  c.classList.remove("down");
  setTimeout(() => ripple.remove(), 600);
}

/** Move to an element and "click" it; the real effect is applied by the caller. */
export async function click(target: Element): Promise<void> {
  await moveTo(target);
  await tap();
}

/**
 * Drag animation: a copy of `from` travels to `to` with the cursor holding it.
 * The caller applies the real state change afterwards.
 */
export async function fly(from: HTMLElement, to: Element, ms = 950): Promise<void> {
  await moveTo(from, 520);
  await tap();
  const a = from.getBoundingClientRect();
  const b = center(to);
  const ghost = from.cloneNode(true) as HTMLElement;
  ghost.classList.add("demo-fly");
  ghost.style.left = `${a.left}px`;
  ghost.style.top = `${a.top}px`;
  ghost.style.width = `${a.width}px`;
  document.body.appendChild(ghost);
  from.style.opacity = "0.3";
  const dx = b.x - (a.left + a.width / 2);
  const dy = b.y - (a.top + a.height / 2);
  const c = cursor();
  // Brief "pick up" lift, then card and cursor travel together. Both run as
  // Web Animations with the same timing, so the card never jumps ahead of the
  // cursor (a CSS transition on a freshly inserted element can skip straight
  // to its end state, e.g. inside an iframe).
  const ease = "cubic-bezier(.45,.05,.25,1)";
  ghost.style.transition = "none";
  await ghost.animate(
    [{ transform: "none" }, { transform: "translateY(-6px) scale(1.06)" }],
    { duration: 180, easing: "ease-out", fill: "forwards" },
  ).finished;
  const start = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
  c.style.transition = "none";
  c.style.left = `${start.x}px`;
  c.style.top = `${start.y}px`;
  const move = ghost.animate(
    [
      { transform: "translateY(-6px) scale(1.06)" },
      { transform: `translate(${dx}px, ${dy}px) scale(.82)` },
    ],
    { duration: ms, easing: ease, fill: "forwards" },
  );
  c.animate(
    [
      { left: `${start.x}px`, top: `${start.y}px` },
      { left: `${b.x}px`, top: `${b.y}px` },
    ],
    { duration: ms, easing: ease, fill: "forwards" },
  );
  await move.finished;
  c.getAnimations().forEach((an) => an.cancel());
  c.style.left = `${b.x}px`;
  c.style.top = `${b.y}px`;
  await sleep(60);
  ghost.remove();
}

export function hideCursor(): void {
  cursorEl?.remove();
  cursorEl = null;
}
