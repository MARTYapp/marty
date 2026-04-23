// src/lib/marty/intents/turnClassification.ts

// ---------- normalization ----------
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (text: string, phrases: string[]) => {
  const normalized = normalize(text);
  return phrases.some((phrase) => normalized.includes(phrase));
};

// ---------- phrase banks ----------
const RECOMMENDATION_PHRASES = [
  "recommend",
  "recommendation",
  "which one",
  "which meeting",
  "pick one",
  "choose one",
  "choose for me",
  "help me choose",
  "what should i go to",
  "which should i",
  "can you pick",
  "can you recommend",
  "tell me where to go",
  "just tell me where to go",
  "pick for me",
  "least annoying option",
  "easiest option",
  "best option",
  "best option tonight",
  "what meeting should i hit",
  "where should i go",
  "what should i hit",
];

const PRACTICAL_HELP_PHRASES = [
  ...RECOMMENDATION_PHRASES,
  "pick",
  "choose",
  "prioritize",
  "priority",
  "order this",
  "sequence",
  "plan",
  "next step",
  "next move",
  "what s the move",
  "what is the move",
  "what should i do",
  "can you help me decide",
  "decide for me",
  "tell me the move",
  "tell me what to do",
  "break this down",
  "map this out",
  "give me the order",
  "what do i do first",
];

// ---------- detectors ----------
export const detectRecommendationRequest = (message: string) => {
  return includesAny(message, RECOMMENDATION_PHRASES);
};

export const detectPracticalHelpRequest = (message: string) => {
  return includesAny(message, PRACTICAL_HELP_PHRASES);
};

export const detectRecoveryContext = (text: string) => {
  return /\b(aa|na|cma|meeting|meetings|sponsor|sobriety|relapse|using|iop|rehab|step|inventory|amends)\b/i.test(
    text
  );
};

export const detectDirectAnswerSignal = (message: string) => {
  return /\b(i did|i called|i texted|i went|i sent|i finished|i started|i talked to|i reached out|today i|this week i|the move is|i chose|i am doing|i'm doing|i completed|i made|i wrote|i asked|i scheduled|i showed up)\b/i.test(
    message
  );
};

export const detectSidestepSignal = (message: string) => {
  return /\b(i know|maybe|tomorrow|later|trying|i want to|i need to|i should|i just|overwhelmed|stuck|confused|but|it’s hard|it's hard)\b/i.test(
    message
  );
};

export const detectWeakReflectionSignal = (message: string) => {
  return /\b(i feel|i'm feeling|i am feeling|i guess|i mean|i know|i realize|i understand|part of me|it's hard|it is hard|overwhelmed|confused|stuck)\b/i.test(
    message
  );
};

// ---------- turn classification ----------
export type TurnType =
  | "recommendation"
  | "utility"
  | "action"
  | "spiral"
  | "question"
  | "dodge"
  | "partial"
  | "neutral";

export const classifyTurn = (message: string): TurnType => {
  const text = message.trim();

  if (!text) return "neutral";

  if (detectRecommendationRequest(text)) return "recommendation";
  if (detectPracticalHelpRequest(text)) return "utility";
  if (detectDirectAnswerSignal(text)) return "action";

  if (
    /\b(panic|spiral|spiraling|relapse|using|craving|freaking out|losing it|can't stop|can’t stop)\b/i.test(
      text
    )
  ) {
    return "spiral";
  }

  if (text.includes("?")) return "question";

  if (detectSidestepSignal(text) && detectWeakReflectionSignal(text)) {
    return "dodge";
  }

  if (detectSidestepSignal(text)) return "partial";

  return "neutral";
};

// ---------- prompts ----------
export const buildTurnTypePrompt = (turnType: TurnType) => {
  switch (turnType) {
    case "recommendation":
      return "User explicitly asked for a recommendation. Make the call. Do not stay abstract.";

    case "utility":
      return "User wants a practical move. Be direct. Choose or prioritize.";

    case "dodge":
      return "User is likely sidestepping. Confront directly. Do not soften.";

    case "partial":
      return "User gave something real but incomplete. Acknowledge briefly, then push further.";

    case "action":
      return "User named an action. Keep it moving. No overpraise.";

    case "question":
      return "Answer clearly, but stay sharp. If avoidance is hidden, call it out.";

    case "spiral":
      return "User is spiraling. Narrow the frame. Reduce overwhelm. Give one grounded move.";

    default:
      return "Stay direct, concise, and useful.";
  }
};

// ---------- utility prompt ----------
export const buildUtilityPrompt = (
  message: string,
  conversation: { content: string }[]
) => {
  const combined = [...conversation.map((entry) => entry.content), message].join(
    " "
  );

  const isRecommendation = detectRecommendationRequest(message);
  const isUtility = detectPracticalHelpRequest(message);
  const isRecovery = detectRecoveryContext(combined);

  if (isRecommendation && isRecovery) {
    return "User wants a recovery recommendation. Recommend the closest or soonest meeting. If options unclear, ask for 2–3 choices and pick one.";
  }

  if (isUtility) {
    return "User asked for a decision or plan. Answer directly. Make the call.";
  }

  return "Stay in normal MARTY mode.";
};

// ---------- fallback ----------
export const buildRecommendationFallback = (
  message: string,
  conversation: { content: string }[]
) => {
  const combined = [...conversation.map((entry) => entry.content), message].join(
    " "
  );

  if (detectRecommendationRequest(message) && detectRecoveryContext(combined)) {
    return "If no data, default to the closest or soonest meeting.";
  }

  if (
    /\b(food|restaurant|dinner|lunch|eat|meal)\b/i.test(combined) &&
    detectRecommendationRequest(message)
  ) {
    return "Recommend the easiest decent option nearby.";
  }

  return "No fallback needed.";
};