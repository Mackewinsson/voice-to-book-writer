export interface LearnLesson {
  title: string;
  description: string;
  challenges: string[];
}

export const learnLessons: LearnLesson[] = [
  {
    title: "Lesson 1: The Hook",
    description: "Your goal is to grab the reader's attention instantly.",
    challenges: [
      "Star 1 (Basic Hook): Write a short opening paragraph (2-4 sentences) that immediately makes the reader want to know more. Use curiosity or a surprising fact. Avoid boring introductions.",
      "Star 2 (Negative Constraint): Great start! Now, write a new hook that starts by attacking a common mistake, misconception, or myth held by your target audience.",
      "Star 3 (Curiosity Gap): Final challenge! Write a hook that starts with a shocking statistic or an unresolved question that cannot be answered with a simple 'Yes' or 'No'."
    ]
  },
  {
    title: "Lesson 2: Maintaining Engagement",
    description: "Keep the audience reading by creating momentum.",
    challenges: [
      "Star 1 (Flow): Write a paragraph that builds upon a previous idea but introduces a new complication. Keep the flow smooth and prevent the reader from losing interest.",
      "Star 2 (Sentence Variation): Write a paragraph where you deliberately mix very short, punchy sentences with longer, explanatory ones. This creates a rhythm.",
      "Star 3 (The Open Loop): Write a paragraph that introduces a fascinating concept or story, but deliberately leaves the resolution hanging to force the user to keep reading."
    ]
  },
  {
    title: "Lesson 3: Human Connection",
    description: "Generate emotion and empathy.",
    challenges: [
      "Star 1 (Vulnerability): Write a paragraph that shares a vulnerable thought or a relatable struggle. Make the reader feel empathy.",
      "Star 2 (Sensory Details): Write a paragraph focusing entirely on sensory details (what is seen, heard, felt) to make a memory or moment feel visceral and real.",
      "Star 3 (The Epiphany): Describe a moment of realization or a shift in mindset. Connect this shift to a universal human desire (love, safety, belonging, purpose)."
    ]
  },
  {
    title: "Lesson 4: Generating Virality",
    description: "Create a highly shareable and punchy conclusion.",
    challenges: [
      "Star 1 (The Punchline): Write a concluding thought that is concise, impactful, and memorable. Make it sound like a quote.",
      "Star 2 (The Call to Action): Write a conclusion that seamlessly integrates a strong, emotional reason for the viewer to share this with a specific type of friend.",
      "Star 3 (The Controversial Take): End with a strong, definitive, and slightly controversial statement that divides opinion but strongly resonates with your core audience."
    ]
  }
];
