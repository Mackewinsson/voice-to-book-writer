export type ScriptFormula = {
  id: string;
  title: string;
  description: string;
  chapters: { title: string; description: string; detailedDescription: string }[];
};

export const scriptFormulas: ScriptFormula[] = [
  // ----------------------------------------------------------------------
  // SCREENWRITING & FICTION
  // ----------------------------------------------------------------------
  {
    id: "save-the-cat",
    title: "Save the Cat!",
    description: "The classic 15-beat screenplay structure by Blake Snyder for commercial storytelling.",
    chapters: [
      { title: "1. Opening Image", description: "A visual that represents the hero's flawed world.", detailedDescription: "This beat establishes the tone, mood, type, and scope of the film. It gives the audience a 'before' snapshot of the hero's life so we can measure how much they change by the end." },
      { title: "2. Theme Stated", description: "A character states the core theme or lesson.", detailedDescription: "Usually spoken by someone other than the protagonist. It's a statement of the truth the protagonist needs to learn before the story is over. Keep it subtle, like an offhand remark or piece of advice the hero ignores." },
      { title: "3. Set-Up", description: "Expand on the hero's world, their flaws, and the stakes.", detailedDescription: "Show the hero at home, work, and play. Establish six things that need fixing in their life. We need to see why the hero's current way of living is unsustainable and why they need to change." },
      { title: "4. Catalyst", description: "The inciting incident. A life-changing event happens.", detailedDescription: "Also known as the inciting incident. This is the moment the hero's world is knocked out of balance. It's usually a telegram, a knock at the door, catching a spouse cheating, or meeting the mentor. It cannot be undone." },
      { title: "5. Debate", description: "The hero hesitates or doubts if they should take action.", detailedDescription: "This is a reaction to the Catalyst. The hero asks: 'Should I do this? Can I do this? Is it safe?' It shows the audience that the journey ahead is dangerous or difficult, raising the stakes." },
      { title: "6. Break into Two", description: "The hero makes a proactive choice to enter the new world.", detailedDescription: "The hero leaves their comfort zone and steps into the 'upside-down' world of Act 2. This must be the hero's own proactive choice, not something forced upon them. The journey officially begins." },
      { title: "7. B Story", description: "Introduce the secondary plot, usually a relationship.", detailedDescription: "This is typically the 'love story' or the introduction of a key ally. The B Story character is often the one who helps the hero learn the theme. It provides a breather from the main plot." },
      { title: "8. Fun and Games", description: "The promise of the premise. The hero explores the new world.", detailedDescription: "This is the core of the movie's trailer. The hero is trying to navigate the new world. They either have a string of easy successes or struggle in a highly entertaining way. The tone is lighter here." },
      { title: "9. Midpoint", description: "A false victory or false defeat. The stakes are raised.", detailedDescription: "A massive shift in the story. If things were going well, they suddenly turn bad (False Victory). If things were going badly, the hero suddenly figures it out (False Defeat). A 'ticking clock' is often introduced here." },
      { title: "10. Bad Guys Close In", description: "Internal and external forces tighten around the hero.", detailedDescription: "The honeymoon is over. The antagonist regroups and attacks harder. The hero's team might start falling apart due to internal conflicts. The pressure mounts relentlessly." },
      { title: "11. All Is Lost", description: "The lowest point. The hero loses everything they gained.", detailedDescription: "The false victory from the midpoint is stripped away. The mentor dies, the love interest leaves, or the plan utterly fails. This beat must contain the 'whiff of death'—a reminder of mortality, literal or metaphorical." },
      { title: "12. Dark Night of the Soul", description: "The hero mourns their loss and finally realizes the theme.", detailedDescription: "The hero hits rock bottom. They wallow in their defeat and realize their old way of thinking (from Act 1) is what caused this failure. In this darkness, they finally understand the Theme stated in Beat 2." },
      { title: "13. Break into Three", description: "Armed with the new lesson, the hero figures out a new plan.", detailedDescription: "Thanks to the B Story character or the realization from the Dark Night, the hero finds the solution. They combine their old knowledge with their new understanding to forge a path forward." },
      { title: "14. Finale", description: "The final showdown. The hero executes the plan.", detailedDescription: "The hero confronts the antagonist or the main problem. They are tested on the theme and prove they have changed. The old world and the new world are synthesized. The bad guys are dispatched in ascending order." },
      { title: "15. Final Image", description: "A visual that mirrors the Opening Image, proving the hero has changed.", detailedDescription: "The opposite of the Opening Image. It provides visual proof that the hero's world and the hero themselves have been fundamentally transformed by the journey." }
    ]
  },
  {
    id: "heros-journey",
    title: "The Hero's Journey",
    description: "The 12 stages of the classic mythic structure popularized by Joseph Campbell.",
    chapters: [
      { title: "1. Ordinary World", description: "Show the hero in their mundane life.", detailedDescription: "Introduce the hero in their normal environment. Establish their characteristics, flaws, and the status quo so the audience can contrast it with the Special World later." },
      { title: "2. Call to Adventure", description: "The hero is presented with a problem.", detailedDescription: "A disruption occurs—a threat, a discovery, or an invitation—that challenges the hero's Ordinary World and demands they take action." },
      { title: "3. Refusal of the Call", description: "The hero hesitates or refuses.", detailedDescription: "Out of fear, insecurity, or a sense of duty to their current life, the hero tries to avoid the adventure. This highlights the danger of the journey." },
      { title: "4. Meeting the Mentor", description: "The hero receives training or advice.", detailedDescription: "A wiser, older figure (or sometimes an object/event) gives the hero the training, equipment, or confidence they need to finally accept the call." },
      { title: "5. Crossing the First Threshold", description: "The hero commits to the adventure.", detailedDescription: "The hero leaves the Ordinary World behind and steps into the Special World. There is no turning back. They must learn the new rules." },
      { title: "6. Tests, Allies, Enemies", description: "The hero faces minor challenges.", detailedDescription: "The hero navigates the Special World, facing initial trials that test their skills. They figure out who can be trusted and who opposes them." },
      { title: "7. Approach to the Inmost Cave", description: "Preparing for the major challenge.", detailedDescription: "The hero and their allies advance toward the heart of the Special World (the antagonist's headquarters or a dangerous location) and prepare for the ultimate test." },
      { title: "8. The Ordeal", description: "The hero confronts their greatest fear.", detailedDescription: "A life-or-death crisis where the hero faces their deepest fear or the main antagonist. The hero must 'die' (metaphorically or literally) to be reborn." },
      { title: "9. Reward (Seizing the Sword)", description: "The hero takes possession of the treasure.", detailedDescription: "Having survived the Ordeal, the hero claims the reward—a weapon, knowledge, an elixir, or reconciliation. There is a brief moment of celebration." },
      { title: "10. The Road Back", description: "The hero begins the journey home.", detailedDescription: "The hero must return to the Ordinary World with the reward, but the antagonist forces are not defeated yet. A chase or a new urgency drives them back." },
      { title: "11. Resurrection", description: "The final, most dangerous climax.", detailedDescription: "The climax. The hero is severely tested one last time on the threshold of home. They must use everything they've learned to survive and purify themselves." },
      { title: "12. Return with the Elixir", description: "The hero returns home transformed.", detailedDescription: "The hero arrives back in the Ordinary World, fundamentally changed. They use the 'elixir' (knowledge or treasure) to heal or improve their community." }
    ]
  },
  {
    id: "story-circle",
    title: "Dan Harmon's Story Circle",
    description: "An elegant 8-step framework for TV episodes, stories, and satisfying character arcs.",
    chapters: [
      { title: "1. You (Comfort)", description: "Establish the protagonist's comfort zone.", detailedDescription: "Show the character in their familiar surroundings. Establish who they are and what their life looks like before the story really begins." },
      { title: "2. Need (Want)", description: "Introduce an unfulfilled desire.", detailedDescription: "Something is missing. The character discovers a problem or develops a conscious or unconscious desire that disrupts their comfort." },
      { title: "3. Go (Unfamiliar situation)", description: "Crossing the threshold.", detailedDescription: "The character makes a decision to pursue their need, crossing from their comfortable world into an unfamiliar, chaotic situation." },
      { title: "4. Search (Adapt)", description: "Struggling to adapt.", detailedDescription: "The character faces trials in the new world. They must adapt to the new rules, finding allies and facing enemies while searching for what they need." },
      { title: "5. Find (Get)", description: "Achieving the goal.", detailedDescription: "They finally find what they were looking for, but the victory is complicated. It often comes at a heavy cost or isn't exactly what they thought they needed." },
      { title: "6. Take (Pay a price)", description: "The consequences hit.", detailedDescription: "The character pays a heavy price for getting what they wanted. They might lose an ally, their innocence, or realize the object of their desire is dangerous." },
      { title: "7. Return (Go back)", description: "Heading back home.", detailedDescription: "The character escapes the unfamiliar world and begins the journey back to their comfortable starting point, often chased by the consequences of their actions." },
      { title: "8. Change (Transformation)", description: "Back where they started, but different.", detailedDescription: "They have returned to the comfort zone, but they are fundamentally changed. They use the lessons learned to resolve the initial flaw or improve their world." }
    ]
  },

  // ----------------------------------------------------------------------
  // NON-FICTION & BLOGS
  // ----------------------------------------------------------------------
  {
    id: "thesis-antithesis",
    title: "Essay: Hegelian Dialectic",
    description: "The classic Thesis, Antithesis, Synthesis structure for essays, articles, and philosophy.",
    chapters: [
      { title: "1. Thesis (The Status Quo)", description: "Present the initial argument.", detailedDescription: "Establish the commonly accepted truth, the current state of affairs, or the initial proposition. Lay out the argument clearly and fairly." },
      { title: "2. Antithesis (The Conflict)", description: "Introduce the counter-argument.", detailedDescription: "Present the contradiction, the opposing viewpoint, or the fatal flaw in the Thesis. Show why the accepted truth is incomplete or wrong." },
      { title: "3. Synthesis (The Resolution)", description: "Reconcile the two points.", detailedDescription: "Form a new, higher truth that resolves the conflict between the Thesis and Antithesis. This is your core original thought or conclusion." }
    ]
  },
  {
    id: "how-to-guide",
    title: "The Ultimate 'How-To' Guide",
    description: "Perfect for high-value blog posts, tutorials, and non-fiction teaching.",
    chapters: [
      { title: "1. The Hook & The Promise", description: "Explain what they'll learn.", detailedDescription: "Start with a strong hook. Clearly state exactly what the reader will achieve by the end of the guide and why it is highly valuable to them." },
      { title: "2. The Problem & Why It's Hard", description: "Empathize with the struggle.", detailedDescription: "Show the reader you understand their pain. Explain why this topic is usually confusing or difficult, validating their past failures or frustrations." },
      { title: "3. The Core Concept (The 'What')", description: "Introduce the solution at a high level.", detailedDescription: "Explain the theory or the 'secret sauce' behind your method. Give them the 10,000-foot view before diving into the tactical details." },
      { title: "4. Step-by-Step Implementation", description: "Break the solution down into steps.", detailedDescription: "The meat of the guide. Provide sequential, actionable steps. Use bullet points, code snippets, or clear instructions. Assume the reader is a beginner." },
      { title: "5. Common Mistakes to Avoid", description: "Warn about pitfalls.", detailedDescription: "Share common errors people make when implementing this method. This builds immense trust and saves the reader hours of frustration." },
      { title: "6. Conclusion & Call to Action", description: "Summarize and direct.", detailedDescription: "Briefly recap the main takeaway. Give them one immediate, small action they can take right now, or direct them to subscribe/buy." }
    ]
  },

  // ----------------------------------------------------------------------
  // SOCIAL MEDIA & SHORT FORM
  // ----------------------------------------------------------------------
  {
    id: "viral-reels-negative-hook",
    title: "Viral Short Form (Negative Hook)",
    description: "Start by calling out a common mistake ('Stop doing X' or 'Why Y is failing'). Highly effective for retention.",
    chapters: [
      { title: "1. The Negative Hook (0-3s)", description: "Grab attention by calling out a mistake.", detailedDescription: "Examples in your current language: 'Stop doing [action]', 'This is why your [goal] is failing', 'You are doing [action] wrong'. This triggers loss aversion." },
      { title: "2. The Setup / Retain (3-10s)", description: "Justify the hook.", detailedDescription: "Tell the viewer exactly why they need to keep watching. Validate the hook and raise the stakes or introduce a relatable problem." },
      { title: "3. The Value Delivery (10-45s)", description: "Deliver the payoff quickly.", detailedDescription: "Give the advice, tell the story, or show the process. Cut out all fluff and pauses. Use fast pacing and visual changes to maintain retention." },
      { title: "4. The Twist (45-55s)", description: "Give one last unexpected tip.", detailedDescription: "Just when they think the video is over, provide a bonus tip or an unexpected twist. This prevents people from swiping away early." },
      { title: "5. Call to Action (55-60s)", description: "Tell them exactly what to do.", detailedDescription: "Give a single, clear directive: 'Save this for later', 'Follow for part 2', or 'Comment X for the link'." }
    ]
  },
  {
    id: "viral-reels-curiosity-hook",
    title: "Viral Short Form (Curiosity Hook)",
    description: "Start with a secret or revelation ('The secret to X nobody tells you'). Builds immense intrigue.",
    chapters: [
      { title: "1. The Curiosity Hook (0-3s)", description: "Tease a secret or revelation.", detailedDescription: "Examples in your current language: 'The secret to [desired result] nobody tells you', 'I found a hidden trick to [achieve goal]', 'Watch this before you [action]'. Make them feel like they are missing out on insider knowledge." },
      { title: "2. The Setup / Retain (3-10s)", description: "Justify the hook.", detailedDescription: "Tell the viewer exactly why they need to keep watching. Validate the hook and raise the stakes or introduce a relatable problem." },
      { title: "3. The Value Delivery (10-45s)", description: "Deliver the payoff quickly.", detailedDescription: "Give the advice, tell the story, or show the process. Cut out all fluff and pauses. Use fast pacing and visual changes to maintain retention." },
      { title: "4. The Twist (45-55s)", description: "Give one last unexpected tip.", detailedDescription: "Just when they think the video is over, provide a bonus tip or an unexpected twist. This prevents people from swiping away early." },
      { title: "5. Call to Action (55-60s)", description: "Tell them exactly what to do.", detailedDescription: "Give a single, clear directive: 'Save this for later', 'Follow for part 2', or 'Comment X for the link'." }
    ]
  },
  {
    id: "viral-reels-value-hook",
    title: "Viral Short Form (Listicle/Value Hook)",
    description: "Start with a clear promise of value ('3 ways to achieve X'). Perfect for educational content.",
    chapters: [
      { title: "1. The Value Hook (0-3s)", description: "Promise a specific number of tips.", detailedDescription: "Examples in your current language: '3 tools you need to [achieve goal]', 'Here are 5 ways to [solve problem]', 'The top 3 mistakes to avoid in [topic]'. Sets a clear expectation." },
      { title: "2. The Setup / Retain (3-10s)", description: "Justify the hook.", detailedDescription: "Tell the viewer exactly why they need to keep watching. Validate the hook and raise the stakes or introduce a relatable problem." },
      { title: "3. The Value Delivery (10-45s)", description: "Deliver the payoff quickly.", detailedDescription: "Give the advice, tell the story, or show the process. Cut out all fluff and pauses. Use fast pacing and visual changes to maintain retention." },
      { title: "4. The Twist (45-55s)", description: "Give one last unexpected tip.", detailedDescription: "Just when they think the video is over, provide a bonus tip or an unexpected twist. This prevents people from swiping away early." },
      { title: "5. Call to Action (55-60s)", description: "Tell them exactly what to do.", detailedDescription: "Give a single, clear directive: 'Save this for later', 'Follow for part 2', or 'Comment X for the link'." }
    ]
  },
  {
    id: "viral-reels-story-hook",
    title: "Viral Short Form (Story Hook)",
    description: "Start with a relatable or shocking personal experience ('I tried X for 30 days...'). Great for vlogs.",
    chapters: [
      { title: "1. The Story Hook (0-3s)", description: "Introduce a personal story or challenge.", detailedDescription: "Examples in your current language: 'I tried [challenge] for 30 days, here's what happened', 'This is how I went from [state A] to [state B]', 'I made a terrible mistake doing [action]'. Instantly connects emotionally." },
      { title: "2. The Setup / Retain (3-10s)", description: "Justify the hook.", detailedDescription: "Tell the viewer exactly why they need to keep watching. Validate the hook and raise the stakes or introduce a relatable problem." },
      { title: "3. The Value Delivery (10-45s)", description: "Deliver the payoff quickly.", detailedDescription: "Give the advice, tell the story, or show the process. Cut out all fluff and pauses. Use fast pacing and visual changes to maintain retention." },
      { title: "4. The Twist (45-55s)", description: "Give one last unexpected tip.", detailedDescription: "Just when they think the video is over, provide a bonus tip or an unexpected twist. This prevents people from swiping away early." },
      { title: "5. Call to Action (55-60s)", description: "Tell them exactly what to do.", detailedDescription: "Give a single, clear directive: 'Save this for later', 'Follow for part 2', or 'Comment X for the link'." }
    ]
  },
  {
    id: "pas-copywriting",
    title: "PAS (Copywriting & Ads)",
    description: "Problem, Agitate, Solution. The most effective formula for ads, emails, and sales copy.",
    chapters: [
      { title: "1. Problem", description: "Call out the specific pain point.", detailedDescription: "Identify your target audience and immediately state the exact problem they are struggling with. Use their own words to show you understand." },
      { title: "2. Agitate", description: "Twist the knife.", detailedDescription: "Explain the consequences of not solving the problem. How is it negatively impacting their life, wasting their time, or costing them money?" },
      { title: "3. Solution", description: "Introduce your product or idea.", detailedDescription: "Present your offering as the perfect, easy cure to the pain you just agitated. Focus on the benefits, not just the features." },
      { title: "4. Call to Action", description: "Tell them clearly how to get it.", detailedDescription: "Provide a low-friction, clear instruction on what they need to click, buy, or do right now to relieve their pain." }
    ]
  },

  // ----------------------------------------------------------------------
  // GENERAL
  // ----------------------------------------------------------------------
  {
    id: "blank-script",
    title: "Blank Canvas",
    description: "Start from scratch with a single empty scene.",
    chapters: [
      { title: "Scene 1", description: "Just start writing!", detailedDescription: "Let your imagination guide you. There are no rules here." }
    ]
  }
];
