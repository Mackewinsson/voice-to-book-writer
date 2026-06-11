export type ScriptFormula = {
  id: string;
  title: string;
  description: string;
  chapters: string[];
};

export const scriptFormulas: ScriptFormula[] = [
  {
    id: "save-the-cat",
    title: "Save the Cat!",
    description: "The classic 15-beat screenplay structure by Blake Snyder.",
    chapters: [
      "1. Opening Image",
      "2. Theme Stated",
      "3. Set-Up",
      "4. Catalyst",
      "5. Debate",
      "6. Break into Two",
      "7. B Story",
      "8. Fun and Games",
      "9. Midpoint",
      "10. Bad Guys Close In",
      "11. All Is Lost",
      "12. Dark Night of the Soul",
      "13. Break into Three",
      "14. Finale",
      "15. Final Image"
    ]
  },
  {
    id: "heros-journey",
    title: "The Hero's Journey",
    description: "The 12 stages of the classic mythic structure.",
    chapters: [
      "1. Ordinary World",
      "2. Call to Adventure",
      "3. Refusal of the Call",
      "4. Meeting the Mentor",
      "5. Crossing the First Threshold",
      "6. Tests, Allies, Enemies",
      "7. Approach to the Inmost Cave",
      "8. The Ordeal",
      "9. Reward (Seizing the Sword)",
      "10. The Road Back",
      "11. Resurrection",
      "12. Return with the Elixir"
    ]
  },
  {
    id: "thesis-antithesis",
    title: "Thesis, Antithesis, Synthesis",
    description: "The Hegelian Dialectic for essays and philosophical scripts.",
    chapters: [
      "1. Thesis (The Status Quo)",
      "2. Antithesis (The Conflict)",
      "3. Synthesis (The Resolution)"
    ]
  },
  {
    id: "three-act",
    title: "Three-Act Structure",
    description: "The standard structural model for narrative fiction.",
    chapters: [
      "Act I: Setup",
      "Act II: Confrontation",
      "Act III: Resolution"
    ]
  },
  {
    id: "blank-script",
    title: "Blank Script",
    description: "Start from scratch with a single empty scene.",
    chapters: [
      "Scene 1"
    ]
  }
];
