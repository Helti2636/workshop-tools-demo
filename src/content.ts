// All demo content. Deliberately generic: written for this demo, with no
// organisation-specific categories. The production tools use their own content.

export const DEMO_TITLE = "Workshop Tools";
export const AUTHOR = "Robin Held";

// ---------------------------------------------------------------------------
// The simulated group. The visitor plays alongside two colleagues whose
// answers are scripted, so the group screens make sense with a single visitor.
// ---------------------------------------------------------------------------
export const YOU = "You";
export const PEERS = ["Lena", "Sam"] as const;
export const PERSONA_NAME = "Amara";

// ---------------------------------------------------------------------------
// Reflection — asked twice: as yourself, then as the persona.
// ---------------------------------------------------------------------------
export const REFLECT = {
  framing: "Think of the best learning experience you’ve had.",
  topicSelf: "What made it work for you?",
  topicPersona: `What would make it work for ${PERSONA_NAME}?`,
  topicNeutral: "What made it work?",
  options: [
    "Practising with real tasks",
    "Learning from peers",
    "An expert I could ask",
    "Time to reflect",
    "Feedback on my work",
    "Something I could use the next day",
  ],
};
// What the simulated colleagues pick (index into REFLECT.options)
export const PEER_REFLECT_PICKS: Record<(typeof PEERS)[number], number> = { Lena: 1, Sam: 5 };

// ---------------------------------------------------------------------------
// Backpack — a metaphor from the in-person workshop.
// ---------------------------------------------------------------------------
export const BACKPACK_QUESTION = "What three things would you pack for your learning journey?";

export interface BackpackItem { id: string; name: string }
export const ITEMS: BackpackItem[] = [
  { id: "map", name: "Map" },
  { id: "compass", name: "Compass" },
  { id: "flashlight", name: "Flashlight" },
  { id: "tent", name: "Tent" },
  { id: "notebook", name: "Notebook" },
  { id: "star", name: "North star" },
  { id: "firstaid", name: "First-aid kit" },
  { id: "binoculars", name: "Binoculars" },
  { id: "water", name: "Water bottle" },
  { id: "snacks", name: "Snacks" },
  { id: "boots", name: "Boots" },
  { id: "powerbank", name: "Powerbank" },
  { id: "swissknife", name: "Swiss knife" },
  { id: "clock", name: "Clock" },
];
export const MAX_ITEMS = 3;
export const PEER_BACKPACKS: Record<(typeof PEERS)[number], string[]> = {
  Lena: ["compass", "notebook", "water"],
  Sam: ["star", "firstaid", "clock"],
};

export const CUSTOM_PREFIX = "custom:";
export const CUSTOM_MAX_LEN = 40;
export function isCustomItem(id: string): boolean {
  return typeof id === "string" && id.startsWith(CUSTOM_PREFIX);
}
export function itemName(id: string): string {
  if (isCustomItem(id)) return id.slice(CUSTOM_PREFIX.length).trim() || "Something else";
  return ITEMS.find((i) => i.id === id)?.name ?? id;
}

// ---------------------------------------------------------------------------
// Persona — the demo shows the first two questions of twelve.
// ---------------------------------------------------------------------------
export interface PersonaQuestion { key: string; label: string; prompt: string; options: string[]; maxSelect: number }

export const PERSONA_QUESTIONS: PersonaQuestion[] = [
  {
    key: "role",
    label: "Role",
    prompt: "Which best describes the learner?",
    maxSelect: 2,
    options: [
      "Specialist",
      "Team lead",
      "Programme manager",
      "Senior manager",
      "Consultant",
      "New joiner",
    ],
  },
  {
    key: "setting",
    label: "Work setting",
    prompt: "Where do they usually work?",
    maxSelect: 2,
    options: [
      "Head office",
      "Regional office",
      "Field office",
      "Hybrid",
      "Fully remote",
      "Often travelling",
    ],
  },
];

// The remaining fields of the full persona, shown as placeholders in the demo.
export const PERSONA_MORE = [
  "Experience",
  "Familiarity with the topic",
  "Time for learning",
  "Connectivity",
  "Preferred language",
  "Biggest hurdle",
  "What they want to achieve",
  "Where they hear about learning",
];

// What the simulated colleagues answered in their own persona (option indices)
export const PEER_PERSONA: Record<(typeof PEERS)[number], Record<string, number[]>> = {
  Lena: { role: [2, 1], setting: [2] },
  Sam: { role: [2], setting: [3, 2] },
};

// ---------------------------------------------------------------------------
// Discussion — one question, talked through out loud.
// ---------------------------------------------------------------------------
export const DISCUSSION =
  "What will your learners start doing, stop doing or do differently because of this learning solution?";

// ---------------------------------------------------------------------------
// Prioritization — a short extract of a longer card deck.
// ---------------------------------------------------------------------------
export const PRIORITY_QUESTION = `Which formats would you prioritise for ${PERSONA_NAME}?`;
export interface PriorityCard { id: string; name: string; description: string }
export const PRIORITY_CARDS: PriorityCard[] = [
  { id: "elearning", name: "Self-paced e-learning", description: "Short online modules learners complete on their own schedule." },
  { id: "workshop", name: "Live virtual workshop", description: "A facilitated session with exercises and discussion." },
  { id: "circle", name: "Peer learning circle", description: "A small group that meets regularly to work on real cases." },
  { id: "jobaid", name: "Job aid", description: "A one-page guide used in the moment of need." },
];
export const GROUPS = ["yes", "maybe", "no"] as const;
export type Group = (typeof GROUPS)[number];
export const GROUP_LABEL: Record<Group, string> = { yes: "Yes", maybe: "Maybe", no: "No" };
export const GROUP_DESC: Record<Group, string> = {
  yes: "A must for this learner",
  maybe: "Worth testing, depending on resources",
  no: "Not the right fit",
};

// ---------------------------------------------------------------------------
// The notes that explain each step — the reason the demo exists.
// ---------------------------------------------------------------------------
export const NOTES = {
  answer:
    "Everyone answers privately first. Nobody sees the others until all have chosen — this avoids the anchoring effect, where the first confident voice pulls the rest of the room.",
  reveal:
    "Answers appear together, with names. The differences are the point: this is where the facilitator opens the conversation.",
  backpack:
    "A metaphor from the in-person workshop, kept intact. Packing by drag and drop instead of filling in a form keeps the playful, physical feel that made the exercise memorable.",
  persona:
    "The full persona has twelve questions, tailored to the organisation’s context. Multiple choice where it makes sense — plus a free-text option everywhere, because real learners rarely fit the boxes.",
  agree:
    "In the group version, everyone first builds their own persona, then the group agrees field by field. You see who gave which answer; options nobody picked stay available, muted, in case the discussion lands somewhere new.",
  card: "The agreed persona becomes the shared reference point for the rest of the session.",
  discuss:
    "A deliberately empty step: one question, nothing to fill in. The group talks; the tool stays out of the way.",
  reflectPersona: "The same question as at the start — now from the persona’s point of view.",
  compare:
    "The pay-off: your own answer next to the persona’s. The gap between the columns is the learning.",
  prioritise:
    "Each format comes with a one-line explanation, and everything already sorted stays visible under its category — nobody needs to take notes.",
  export:
    "The tools store nothing, on purpose. Whatever the group wants to keep, it takes away as a document.",
};
