export interface LearnLesson {
  title: string;
  description: string;
  detailedDescription: string;
}

export const learnLessons: LearnLesson[] = [
  {
    title: "Lesson 1: The Hook",
    description: "Your goal is to grab the reader's attention instantly.",
    detailedDescription: "In this challenge, you must write a short opening paragraph (2-4 sentences) that immediately makes the reader want to know more. Use curiosity, a surprising fact, or an engaging question. Avoid starting with boring context or introductions. The AI will evaluate your text purely on how well it hooks the reader.",
  },
  {
    title: "Lesson 2: Maintaining Engagement",
    description: "Keep the audience reading by creating momentum.",
    detailedDescription: "Now that you have their attention, you must keep it. Write a paragraph that builds upon a previous idea but introduces a new complication, interesting fact, or escalation. The writing should flow smoothly, use varied sentence lengths, and prevent the reader from losing interest.",
  },
  {
    title: "Lesson 3: Human Connection",
    description: "Generate emotion and empathy.",
    detailedDescription: "Content that connects emotionally is remembered. Write a paragraph that shares a vulnerable thought, a relatable struggle, or a deep human insight. The goal is to make the reader feel something (empathy, joy, sadness, or relief) rather than just processing information.",
  },
  {
    title: "Lesson 4: Generating Virality",
    description: "Create a highly shareable and punchy conclusion.",
    detailedDescription: "Viral content often ends with a strong, definitive, and slightly controversial or highly relatable statement. Write a concluding thought that would make someone want to immediately share it with a friend or retweet it. It should be concise, impactful, and memorable.",
  }
];
