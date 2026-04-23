
// src/lib/marty/memory/conversationMemory.ts
import { clip } from "@/lib/marty/helpers/textSignals";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// ---------- helpers ----------
const getRecentUserMessages = (
  conversation: ChatMessage[],
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

const getRecentAssistantMessages = (
  conversation: ChatMessage[],
  limit = 4
) => {
  return conversation
    .filter((entry) => entry.role === "assistant")
    .map((entry) => entry.content.trim())
    .filter(Boolean)
    .slice(-limit);
};

const getLastAssistantMessage = (conversation: ChatMessage[]) => {
  for (let i = conversation.length - 1; i >= 0; i--) {
    if (conversation[i]?.role === "assistant") {
      return conversation[i].content.trim();
    }
  }
  return "";
};

const detectAssistantMemorySignals = (messages: string[]) => {
  const joined = messages.join(" \n ").toLowerCase();

  const signals = [
    {
      label: "specificity",
      regex: /\b(be specific|specific|what actually happened|say it straight|full story)\b/g,
    },
    {
      label: "action",
      regex: /\b(next move|next step|do that first|pick one task|start there|take the step)\b/g,
    },
    {
      label: "avoidance",
      regex: /\b(avoidance|stalling|sidestep|dodging|performing insight)\b/g,
    },
    {
      label: "pattern",
      regex: /\b(loop|same pattern|same issue|new wording|repeating)\b/g,
    },
  ];

  return signals
    .map(({ label, regex }) => ({
      label,
      count: (joined.match(regex) || []).length,
    }))
    .filter(({ count }) => count >= 1)
    .map(({ label }) => label);
};

// ---------- theme detection ----------
const detectRecurringThemes = (messages: string[]) => {
  const joined = messages.join(" ").toLowerCase();

  const themes = [
    {
      label: "relationships",
      regex: /\b(boyfriend|girlfriend|dating|ex|partner|crush|relationship)\b/g,
    },
    {
      label: "recovery",
      regex: /\b(aa|na|cma|meeting|sponsor|sobriety|relapse|using|rehab|iop)\b/g,
    },
    {
      label: "work",
      regex: /\b(work|job|career|project|writing|client|app|marty)\b/g,
    },
    {
      label: "avoidance",
      regex: /\b(maybe|later|tomorrow|trying|should|stuck|avoid|overwhelmed)\b/g,
    },
  ];

  return themes
    .map(({ label, regex }) => ({
      label,
      count: (joined.match(regex) || []).length,
    }))
    .filter(({ count }) => count >= 2)
    .map(({ label }) => label);
};

// ---------- open loops ----------
const extractOpenLoops = (messages: string[]) => {
  const regex =
    /\b(i need to|i should|i'm going to|i am going to|i want to|i have to)\b([^.!?\n]{0,120})/gi;

  const loops: string[] = [];

  for (const message of messages) {
    let match: RegExpExecArray | null;

    while ((match = regex.exec(message)) !== null) {
      const phrase = `${match[1]}${match[2]}`
        .replace(/\s+/g, " ")
        .trim();

      if (phrase.length >= 12) {
        loops.push(clip(phrase));
      }
    }
  }

  return Array.from(new Set(loops)).slice(-4);
};

// ---------- turn count ----------
export const getUserTurnCount = (
  conversation: ChatMessage[],
  message: string
) => {
  return getRecentUserMessages(conversation, message).length;
};

// ---------- main builder ----------
export const buildConversationMemory = (
  conversation: ChatMessage[],
  message: string
) => {
  const userMessages = getRecentUserMessages(conversation, message);
  const assistantMessages = getRecentAssistantMessages(conversation);
  const lastAssistant = getLastAssistantMessage(conversation);

  const userTurnCount = userMessages.length;

  // early guard
  if (userTurnCount < 3) {
    return [
      "Conversation memory:",
      "Early conversation — do not infer patterns yet.",
      "Respond only to what is present.",
      "If vague, ask for specifics.",
      "If they ask what to do, give one clear move.",
    ].join(" ");
  }

  const themes = detectRecurringThemes(userMessages);
  const loops = extractOpenLoops(userMessages);
  const assistantSignals = detectAssistantMemorySignals(assistantMessages);

  const repeatedMessage =
    userMessages.length >= 2 &&
    userMessages
      .slice(0, -1)
      .some(
        (entry) =>
          entry.toLowerCase().trim() === message.toLowerCase().trim()
      );

  return [
    "Conversation memory:",

    themes.length
      ? `Themes: ${themes.join(", ")}.`
      : "Themes: none clearly detected.",

    loops.length
      ? `Open loops: ${loops.join(" | ")}.`
      : "Open loops: none clearly extracted.",

    repeatedMessage
      ? "User repeated the same message before. Call it out if relevant."
      : "Do not force repetition.",

    assistantSignals.length
      ? `Recent assistant emphasis: ${assistantSignals.join(", ")}.`
      : "Recent assistant emphasis: none clearly detected.",

    lastAssistant
      ? `Last assistant message: ${clip(lastAssistant, 180)}`
      : "No prior assistant message.",

    "If user repeats intention without action, call it out.",
    "If context matters, reference it naturally.",
    "Push toward a concrete next step when possible.",
  ].join(" ");
};