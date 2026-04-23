// src/lib/marty/policies/patternGuards.ts

import { getSignalOverlap } from "@/lib/marty/helpers/textSignals";

const PATTERN_LANGUAGE_TERMS = [
  "same message",
  "same frustration",
  "same loop",
  "same pattern",
  "repeating",
  "repeating yourself",
  "you're repeating",
  "you are repeating",
  "repeat",
  "again",
  "you already know the move",
];

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const hasSubstantialSimilarity = (a: string, b: string) => {
  return getSignalOverlap(a, b).length >= 3;
};

export const detectAssistantCallouts = (messages: string[]) => {
  const joined = messages.join(" \n ").toLowerCase();

  const callouts = [
    {
      label: "vagueness",
      regex: /\b(vague|specific|be specific|not the full story)\b/g,
    },
    {
      label: "pattern",
      regex: /\b(loop|same loop|same pattern|new wording|same issue|repeating)\b/g,
    },
    {
      label: "avoidance",
      regex: /\b(avoidance|stalling|sidestep|dodging|uncertainty|relief|results)\b/g,
    },
    {
      label: "action",
      regex: /\b(next move|next step|do that first|pick one task|start it|action)\b/g,
    },
  ];

  return callouts
    .map(({ label, regex }) => ({
      label,
      count: (joined.match(regex) || []).length,
    }))
    .filter(({ count }) => count >= 1)
    .map(({ label }) => label);
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

export const detectQuestionLikePrompt = (message: string) => {
  return (
    message.includes("?") ||
    /\b(be specific|what did you actually do|what changed|do that first|pick one task|who did you talk to|what did you do this week|still vague)\b/i.test(
      message.toLowerCase()
    )
  );
};

export const detectUnansweredCallout = (
  lastAssistant: string,
  message: string,
  assistantCallouts: string[]
) => {
  if (!lastAssistant) {
    return {
      unanswered: false,
      expectedAnswer: false,
      signalOverlap: [] as string[],
    };
  }

  const expectedAnswer = detectQuestionLikePrompt(lastAssistant);
  const direct = detectDirectAnswerSignal(message);
  const sidestep = detectSidestepSignal(message);
  const weak = detectWeakReflectionSignal(message);
  const signalOverlap = getSignalOverlap(lastAssistant, message);

  const unanswered =
    expectedAnswer &&
    assistantCallouts.length > 0 &&
    !direct &&
    (sidestep || weak) &&
    signalOverlap.length < 2;

  return {
    unanswered,
    expectedAnswer,
    signalOverlap,
  };
};

export const detectPatternEvidence = (
  conversation: { role: string; content: string }[],
  message: string
) => {
  const userMessages = conversation
    .filter((entry) => entry.role === "user")
    .map((entry) => entry.content.trim())
    .filter(Boolean)
    .slice(-6);

  const assistantMessages = conversation
    .filter((entry) => entry.role === "assistant")
    .map((entry) => entry.content.trim())
    .filter(Boolean)
    .slice(-4);

  const lastAssistant = assistantMessages[assistantMessages.length - 1] || "";

  const repeatedUser =
    userMessages.length >= 2 &&
    userMessages.slice(0, -1).some((entry) => {
      const current = message.trim().toLowerCase();
      const prior = entry.trim().toLowerCase();
      return prior === current || hasSubstantialSimilarity(prior, current);
    });

  const repeatedEmotionWithoutAction =
    userMessages.length >= 2 &&
    /\b(angry|ashamed|guilty|frustrated|depressed|sad|upset|anxious)\b/i.test(
      message
    ) &&
    !detectDirectAnswerSignal(message) &&
    userMessages.slice(0, -1).some((entry) => {
      return (
        /\b(angry|ashamed|guilty|frustrated|depressed|sad|upset|anxious)\b/i.test(
          entry
        ) && !detectDirectAnswerSignal(entry)
      );
    });

  const callouts = detectAssistantCallouts(assistantMessages);
  const { unanswered } = detectUnansweredCallout(
    lastAssistant,
    message,
    callouts
  );

  const score =
    (repeatedUser ? 2 : 0) +
    (repeatedEmotionWithoutAction ? 1 : 0) +
    (callouts.length ? 1 : 0) +
    (unanswered ? 2 : 0);

  const hasEnoughUserTurns = [...userMessages, message.trim()].filter(Boolean)
    .length >= 3;

  return {
    allowPatternLanguage: score >= 3 && hasEnoughUserTurns,
    allowStrongPatternLanguage: score >= 4 && hasEnoughUserTurns,
  };
};

export const buildPatternGuardPrompt = (
  allowPatternLanguage: boolean,
  allowStrongPatternLanguage: boolean
) => {
  if (!allowPatternLanguage) {
    return [
      "Pattern guard: there is not enough evidence to claim repetition or a pattern.",
      "Do not say 'same message,' 'same frustration,' 'same loop,' 'same pattern,' 'again,' or 'you already know the move.'",
      "Respond only to what is actually present in the current message.",
    ].join(" ");
  }

  if (!allowStrongPatternLanguage) {
    return [
      "Pattern guard: there is limited evidence of repetition.",
      "If you reference a pattern, name exactly what is repeating.",
      "Do not use broad phrases like 'same loop' or 'you already know the move.'",
    ].join(" ");
  }

  return [
    "Pattern guard: there is enough evidence to name a pattern.",
    "If you call out repetition, say exactly what is repeating.",
    "Use pattern language only if it is specific and earned.",
  ].join(" ");
};

export const removeUngroundedPatternLanguage = (
  reply: string,
  allowPatternLanguage: boolean,
  allowStrongPatternLanguage: boolean
) => {
  if (allowStrongPatternLanguage) return reply;

  let next = reply;

  if (!allowPatternLanguage) {
    for (const term of PATTERN_LANGUAGE_TERMS) {
      next = next.replace(new RegExp(escapeRegExp(term), "gi"), "");
    }

    next = next.replace(/\s{2,}/g, " ").trim();
  }

  if (!allowStrongPatternLanguage) {
    next = next
      .replace(/same loop/gi, "same issue")
      .replace(/same pattern/gi, "similar issue")
      .replace(/you already know the move/gi, "focus on the next step")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return next;
};