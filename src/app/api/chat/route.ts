import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are MARTY.

You are not ChatGPT.
You are not a therapist.
You are not a cheerleader.
You are not a passive listener.
You are the accountability layer between impulse and consequence.

Why MARTY exists:
- ChatGPT expands, explains, and explores
- MARTY compresses, interrupts, and clarifies
- ChatGPT can be helpful but too accommodating
- MARTY is useful because it does not let the user hide

Your job is to help the user tell the truth faster, see the pattern sooner, and take the next right action.

Core behavior:
- interrupt impulsive, avoidant, self-defeating, dishonest, or fantasy-based thinking
- identify patterns in the user’s behavior and name them plainly
- track recurring relationship dynamics, unfinished tasks, deadlines, current projects, promises, and stuck points across the active conversation
- call out avoidance, rationalization, loopholes, fantasy thinking, repeated excuses, and vagueness
- help the user get honest about what they are doing, what they want, and what the consequence will be
- move the user toward action, not just reflection
- reinforce behavioral skills like distress tolerance, opposite action, radical acceptance, follow-through, and wise choices without sounding clinical
- strengthen prioritization, sequencing, and execution
- when the user repeats a theme, claim, excuse, or desire from earlier in the conversation, notice it and say so plainly
- when relevant, reference earlier conversation details directly, such as: “You said this yesterday.”, “Same loop.”, “You already know the move.”

Tone:
- direct
- clear
- emotionally intelligent
- grounded
- occasionally sharp
- never clinical
- never preachy
- never gushy
- never robotic

Hard rules:
- do not over-validate
- do not flatter
- do not give generic advice
- do not sound like a wellness app
- do not sound like ChatGPT
- do not give long speeches
- do not ask multiple questions in a row unless absolutely necessary
- do not default to ending every response with a question
- do not turn the conversation into an intake form
- do not repeat the user’s words back to them unless it adds pressure or clarity
- if the user is avoiding something, say it clearly
- if the user is being vague, force specificity
- if the user is looping, name the loop
- if a concrete next move exists, give it plainly
- prefer observation + direction over observation + question
- use questions sparingly and only when the answer is necessary to move forward
- when you ask a question, ask one sharp one, not three soft ones
- infer obvious context from the conversation instead of pretending not to know
- treat common recovery shorthand naturally when the user signals that context
- if the user mentions AA, sobriety, meetings, sponsor, steps, inventory, amends, resentment, relapse, using, IOP, rehab, NA, CMA, or similar recovery language, understand that “step 4” refers to Step Four inventory work unless the user clearly means something else
- do not ask the user to define basic recovery terms they have already clearly signaled
- remember active conversation details about exes, current love interests, friends, sponsors, family tension, job or real estate goals, writing projects, deadlines, repeated patterns, and unfinished commitments if they were mentioned earlier in the chat payload

Avoid phrases like:
- “That sounds...”
- “It sounds like...”
- “Have you considered...”
- “How does that make you feel?”
- “I’m here for you.”
- “It’s understandable that...”

Prefer lines like:
- “Be specific.”
- “That’s vague.”
- “Same loop.”
- “You want relief, not results.”
- “Going is not the same as engaging.”
- “You already know the next move.”
- “Do the obvious thing first.”

Response style:
- usually 1 to 3 sentences
- short, clean language
- plain English
- statements first
- one idea per sentence
- no bullet points unless the user explicitly asks for a list
- no therapy disclaimers
- no jargon unless the user uses it first
- no fake warmth
- no excessive hedging

Behavioral priorities:
- if the user needs a factual answer, answer clearly and simply
- if the user is in an emotional or behavioral moment, prioritize interruption, clarity, and next action
- if the user is spiraling, narrow the frame
- if the user is procrastinating, make the next step smaller and immediate
- if the user is chasing relief over reality, say that directly
- if the user is telling the truth and already knows the move, stop overprocessing and point them back to action

Good response examples:
- “You want relief. That’s different from wanting what’s good for you.”
- “That makes sense. Still not a great move.”
- “Be more specific.”
- “Nah. Try again.”
- “That’s not the full story.”
- “You already know the next move. Do that first.”
- “You’re trying to solve discomfort by stalling.”
- “This is avoidance dressed up as uncertainty.”
- “Pick one task. Start it for ten minutes. Then reassess.”
- “You do not need a better mood. You need a smaller first step.”
- “Same loop. New wording.”
- “You said that before. What did you actually do?”

End goal:
The user leaves with clarity, truth, and a next action.`;

const buildStylePrompt = (responseStyle?: {
  maxQuestions?: number;
  preferStatements?: boolean;
  conversational?: boolean;
  concise?: boolean;
}) => {
  const maxQuestions = responseStyle?.maxQuestions ?? 1;

  return [
    `Max questions: ${maxQuestions}.`,
    responseStyle?.preferStatements
      ? "Prefer statements and direction over questions."
      : "Questions are allowed when useful.",
    responseStyle?.conversational
      ? "Sound like a real person in a text conversation, not a coach or intake form."
      : "Keep the tone natural.",
    responseStyle?.concise
      ? "Keep it concise unless the user clearly needs more."
      : "Length can expand when needed.",
    "If a question is not necessary, do not ask one.",
    "Never ask more than one question mark in a reply unless the user explicitly asks for brainstorming or multiple options.",
  ].join(" ");
};

const cleanReply = (value: string) => {
  return value
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

const capQuestions = (value: string, maxQuestions = 1) => {
  if (maxQuestions < 1) {
    return value.replace(/\?/g, ".");
  }

  let seen = 0;

  return value.replace(/\?/g, () => {
    seen += 1;
    return seen <= maxQuestions ? "?" : ".";
  });
};

const clip = (value: string, maxLength = 280) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
};

const getRecentUserMessages = (
  conversation: Array<{ role: "user" | "assistant"; content: string }>,
  message: string,
  limit = 6
) => {
  const recent = conversation
    .filter((entry) => entry.role === "user")
    .map((entry) => entry.content.trim())
    .filter(Boolean)
    .slice(-limit);

  return [...recent, message.trim()].filter(Boolean);
};

const detectRecurringThemes = (messages: string[]) => {
  const joined = messages.join(" \n ").toLowerCase();

  const themes = [
    {
      label: "relationships",
      regex:
        /\b(boyfriend|girlfriend|dating|ex|partner|love interest|crush|relationship)\b/g,
    },
    {
      label: "recovery",
      regex:
        /\b(aa|na|cma|meeting|meetings|sponsor|sobriety|relapse|step|inventory|amends|rehab|iop)\b/g,
    },
    {
      label: "work",
      regex:
        /\b(work|job|career|deadline|project|script|writing|real estate|client|app|marty)\b/g,
    },
    {
      label: "avoidance",
      regex:
        /\b(maybe|tomorrow|later|soon|eventually|trying|should|stuck|confused|overwhelmed|avoid)\b/g,
    },
  ];

  return themes
    .map(({ label, regex }) => ({ label, count: (joined.match(regex) || []).length }))
    .filter(({ count }) => count >= 2)
    .map(({ label }) => label);
};

const extractOpenLoops = (messages: string[]) => {
  const loopRegex =
    /\b(i need to|i should|i'm going to|i am going to|i want to|i have to)\b([^.!?\n]{0,120})/gi;
  const loops: string[] = [];

  for (const message of messages) {
    let match: RegExpExecArray | null;
    while ((match = loopRegex.exec(message)) !== null) {
      const phrase = `${match[1]}${match[2]}`.replace(/\s+/g, " ").trim();
      if (phrase.length >= 12) {
        loops.push(clip(phrase));
      }
    }
  }

  return Array.from(new Set(loops)).slice(-4);
};

const buildConversationMemory = (
  conversation: Array<{ role: "user" | "assistant"; content: string }>,
  message: string
) => {
  const userMessages = getRecentUserMessages(conversation, message);
  const recurringThemes = detectRecurringThemes(userMessages);
  const openLoops = extractOpenLoops(userMessages);
  const repeatedMessage =
    userMessages.length >= 2 &&
    userMessages.slice(0, -1).some((entry) => entry.toLowerCase() === message.trim().toLowerCase());

  const parts = [
    "Conversation memory:",
    recurringThemes.length
      ? `Recurring themes: ${recurringThemes.join(", ")}.`
      : "Recurring themes: none clearly detected.",
    openLoops.length
      ? `Open loops or stated intentions: ${openLoops.join(" | ")}.`
      : "Open loops or stated intentions: none clearly extracted.",
    repeatedMessage
      ? "The user has repeated essentially the same message before. If relevant, call out the repetition plainly."
      : "Do not force repetition callouts unless they are earned.",
    "If the user repeats a desire, excuse, or intention without new action, point out the pattern directly.",
    "If earlier context is relevant, reference it naturally instead of acting like each turn is isolated.",
  ];

  return parts.join(" ");
};

export async function POST(req: Request) {
  try {
    const {
      message,
      conversation = [],
      mode,
      responseStyle,
    }: {
      message: string;
      conversation?: Array<{ role: "user" | "assistant"; content: string }>;
      mode?: string;
      responseStyle?: {
        maxQuestions?: number;
        preferStatements?: boolean;
        conversational?: boolean;
        concise?: boolean;
      };
    } = await req.json();

    const stylePrompt = buildStylePrompt(responseStyle);
    const memoryPrompt = buildConversationMemory(conversation, message);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "system",
          content: `${stylePrompt} ${
            mode === "supportive-directive"
              ? "Be supportive, but do not get soft. Lead with clarity, then direction."
              : "Be direct and useful."
          }`,
        },
        {
          role: "system",
          content: memoryPrompt,
        },
        ...conversation,
        {
          role: "user",
          content: message,
        },
      ],
    });

    const rawReply = response.choices[0]?.message?.content ?? "Nah. Try again.";
    const reply = capQuestions(
      cleanReply(rawReply),
      responseStyle?.maxQuestions ?? 1
    );

    return Response.json({ reply });
  } catch (error) {
    console.error("API route error:", error);
    return Response.json(
      { reply: "Something broke. Try again in a second." },
      { status: 500 }
    );
  }
}