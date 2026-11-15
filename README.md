# Workshop Tools — Interactive Demo

A short, self-guided tour of workshop tools built for distributed learning
teams. It plays one round of each step of the full tools — answering
privately, revealing together, packing a learning backpack, building and
agreeing on a learner persona, comparing perspectives, prioritising formats
and exporting the result as a PDF.

Two simulated colleagues play along, so the group features work for a single
visitor. All content has been generalised for demonstration purposes.

**Live:** https://helti2636.github.io/workshop-tools-demo/

## Useful links

| Link | What it does |
|---|---|
| `…/workshop-tools-demo/` | The normal tour |
| `…/?autoplay=1` | Plays the whole tour by itself, with captions (~70 s) — for screen recordings |
| `…/?theme=dark` / `?theme=light` | Forces a colour scheme (otherwise it follows the device) |
| `…/?jump=agree` | Opens a single step with sample answers, e.g. for screenshots. Steps: `answer`, `reveal`, `backpack`, `backpacks`, `persona1`, `persona2`, `agree`, `card`, `discuss`, `reflectPersona`, `compare`, `prioritise`, `end` |
| `…/?notes=0` | Starts with the design notes hidden |

Parameters can be combined: `?autoplay=1&theme=dark`.

## How it is built

A static single-page app (React + TypeScript + Vite). No server, no database,
nothing is stored — it runs entirely in the browser and loads instantly.

- `src/content.ts` — every text of the tour, the simulated colleagues' answers
  and the design notes
- `src/App.tsx` — the steps and the self-playing video mode
- `src/components/` — backpack, prioritization, persona card and the other parts
- `src/demo.css` — the design system

## Changing something

```
npm install
npm run dev          # local preview at http://localhost:5173
npm run build        # writes the site to /docs
```

Commit and push the updated `/docs` folder; GitHub Pages publishes it from
`main` → `/docs` within a minute or two.

---

Concept and design: Robin Held
