import { openai } from "@/lib/marty/client/openai";
import { MARTY_MODEL, MARTY_TEMPERATURE } from "@/lib/marty/config/modelConfig";
import { buildStylePrompt } from "@/lib/marty/config/styleRules";
import { systemPrompt } from "@/lib/marty/config/systemPrompt";
import { enforceMartyVoice } from "@/lib/marty/postprocess/enforceMartyVoice";
import type { ChatRequestBody, ChatMessage } from "@/lib/marty/types/chat";

const clip = (value: string, maxLength = 280) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
};

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "if",
  "then",
  "than",
  "that",
  "this",
  "those",
  "these",
  "you",
  "your",
  "yours",
  "are",
  "is",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "for",
  "from",
  "in",
  "on",
  "at",
  "by",
  "with",
  "about",
  "into",
  "over",
  "after",
  "before",
  "through",
  "during",
  "it",
  "its",
  "i",
  "me",
  "my",
  "we",
  "our",
  "us",
  "they",
  "them",
  "their",
  "he",
  "she",
  "him",
  "her",
  "what",
  "who",
  "when",
  "where",
  "why",
  "how",
  "do",
  "did",
  "does",
  "doing",
  "done",
  "have",
  "has",
  "had",
  "can",
  "could",
  "should",
  "would",
  "will",
  "just",
  "really",
  "very",
  "still",
  "same",
  "more",
  "most",
  "much",
  "kind",
  "sort",
  "like",
  "know",
  "need",
  "want",
  "trying",
]);

const tokenizeSignalWords = (value: string, minLength = 4) => {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(
          (token) =>
            token.length >= minLength &&
            !STOP_WORDS.has(token) &&
            !/^\d+$/.test(token)
        )
    )
  );
};

const getSignalOverlap = (source: string, target: string) => {
  const sourceTokens = tokenizeSignalWords(source);
  const targetTokens = tokenizeSignalWords(target);

  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return [] as string[];
  }

  const targetSet = new Set(targetTokens);
  return sourceTokens.filter((token) => targetSet.has(token));
};

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
  for (let i = conversation.length - 1; i >= 0; i -= 1) {
    if (conversation[i]?.role === "assistant") {
      return conversation[i].content.trim();
    }
  }

  return "";
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
    .map(({ label, regex }) => ({
      label,
      count: (joined.match(regex) || []).length,
    }))
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

const detectAssistantCallouts = (messages: string[]) => {
  const joined = messages.join(" \n ").toLowerCase();

  const callouts = [
    {
      label: "vagueness",
      regex: /\b(vague|specific|be specific|not the full story)\b/g,
    },
    {
      label: "loop",
      regex: /\b(loop|same loop|same pattern|new wording)\b/g,
    },
    {
      label: "avoidance",
      regex: /\b(avoidance|stalling|uncertainty|relief|results)\b/g,
    },
    {
      label: "action",
      regex: /\b(next move|do that first|pick one task|start it|action)\b/g,
    },
    {
      label: "engagement",
      regex: /\b(engaging|connecting|attending)\b/g,
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

const detectQuestionLikePrompt = (message: string) => {
  const lowered = message.toLowerCase();

  return (
    message.includes("?") ||
    /\b(be specific|what did you actually do|what changed|do that first|pick one task|who did you talk to|what did you do this week|still vague)\b/i.test(
      lowered
    )
  );
};

const detectDirectAnswerSignal = (message: string) => {
  return /\b(i did|i called|i texted|i went|i sent|i finished|i started|i talked to|i reached out|today i|this week i|the move is|i chose|i am doing|i'm doing|i completed|i made|i wrote|i asked|i scheduled|i showed up)\b/i.test(
    message
  );
};

const detectSidestepSignal = (message: string) => {
  return /\b(i know|maybe|tomorrow|later|trying|i want to|i need to|i should|i just|overwhelmed|stuck|confused|but|it’s hard|it's hard)\b/i.test(
    message
  );
};

const detectWeakReflectionSignal = (message: string) => {
  return /\b(i feel|i'm feeling|i am feeling|i guess|i mean|i know|i realize|i understand|part of me|it's hard|it is hard|overwhelmed|confused|stuck)\b/i.test(
    message
  );
};

const normalizeForIntent = (message: string) => {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const matchesAnyPhrase = (message: string, phrases: string[]) => {
  const normalized = normalizeForIntent(message);
  return phrases.some((phrase) => normalized.includes(phrase));
};

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
  "which meeting should i hit",
  "tell me where to go",
  "just tell me where to go",
  "pick for me",
  "least annoying option",
  "easiest option",
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
  "map this out",
  "break this down",
  "give me the order",
  "what do i do first",
  "tell me the move",
  "tell me what to do",
];

const detectRecommendationRequest = (message: string) => {
  return matchesAnyPhrase(message, RECOMMENDATION_PHRASES);
};

const detectPracticalHelpRequest = (message: string) => {
  return matchesAnyPhrase(message, PRACTICAL_HELP_PHRASES);
};

const detectRecoveryContext = (value: string) => {
  return /\b(aa|na|cma|meeting|meetings|sponsor|sobriety|relapse|using|iop|rehab|step|inventory|amends)\b/i.test(
    value
  );
};

const buildUtilityPrompt = (
  message: string,
  conversation: ChatMessage[]
) => {
  const recentText = [...conversation.map((entry) => entry.content), message].join(
    " \n "
  );
  const isRecommendationRequest = detectRecommendationRequest(message);
  const isPracticalHelpRequest = detectPracticalHelpRequest(message);
  const isRecoveryRequest = detectRecoveryContext(recentText);

  if (isRecommendationRequest && isRecoveryRequest) {
    return "Utility mode: the user asked for a recommendation in a recovery context. Give one concrete recommendation now. Do not stay in confrontation mode. If you do not have real meeting data, recommend the simplest default: the closest meeting that starts the soonest, or ask the user to send 2 to 3 options and choose between them.";
  }

  if (isPracticalHelpRequest) {
    return "Utility mode: the user asked for a practical choice, recommendation, prioritization, or next move. Answer the request directly. Do not dodge behind attitude. Make the call, or give the best default if some details are missing.";
  }

  return "Stay in normal MARTY mode.";
};

const buildRecommendationFallback = (
  message: string,
  conversation: ChatMessage[]
) => {
  const recentText = [...conversation.map((entry) => entry.content), message].join(
    " \n "
  );
  const normalized = normalizeForIntent(recentText);

  if (
    detectRecommendationRequest(message) &&
    detectRecoveryContext(recentText)
  ) {
    return "Recommendation fallback: if you do not have real meeting data, still give a concrete recommendation. Default to the closest meeting that starts the soonest. If the user has options, tell them to send 2 or 3 and choose one for them. Do not reply with a generic push line instead of a recommendation.";
  }

  if (
    /\b(food|restaurant|dinner|lunch|eat|meal)\b/i.test(normalized) &&
    detectRecommendationRequest(message)
  ) {
    return "Recommendation fallback: if details are missing, recommend the easiest decent option nearby or the lowest-friction meal that supports the user's goal. Make the call.";
  }

  return "No special fallback needed.";
};

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

const getUserTurnCount = (conversation: ChatMessage[], message: string) => {
  return getRecentUserMessages(conversation, message).length;
};

const hasSubstantialSimilarity = (a: string, b: string) => {
  const overlap = getSignalOverlap(a, b);
  return overlap.length >= 3;
};

const detectPatternEvidence = (
  conversation: ChatMessage[],
  message: string
) => {
  const userMessages = getRecentUserMessages(conversation, message);
  const lastAssistantMessage = getLastAssistantMessage(conversation);
  const recentAssistantMessages = getRecentAssistantMessages(conversation);
  const recurringThemes = detectRecurringThemes(userMessages);

  const repeatedUserMessage =
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

  const assistantCallouts = detectAssistantCallouts(recentAssistantMessages);
  const assistantAlreadyCalledItOut =
    assistantCallouts.length > 0 && !!lastAssistantMessage;

  const unansweredCallout =
    assistantAlreadyCalledItOut &&
    detectUnansweredCallout(
      lastAssistantMessage,
      message,
      assistantCallouts
    ).unansweredCalloutDetected;

  const evidenceScore =
    (repeatedUserMessage ? 2 : 0) +
    (repeatedEmotionWithoutAction ? 1 : 0) +
    (recurringThemes.length > 0 ? 1 : 0) +
    (unansweredCallout ? 2 : 0);

  const hasEnoughUserTurns = userMessages.length >= 3;

  return {
    repeatedUserMessage,
    repeatedEmotionWithoutAction,
    assistantAlreadyCalledItOut,
    unansweredCallout,
    recurringThemes,
    evidenceScore,
    allowPatternLanguage: evidenceScore >= 3 && hasEnoughUserTurns,
    allowStrongPatternLanguage: evidenceScore >= 4 && hasEnoughUserTurns,
  };
};

const buildPatternGuardPrompt = (
  conversation: ChatMessage[],
  message: string
) => {
  const evidence = detectPatternEvidence(conversation, message);

  if (!evidence.allowPatternLanguage) {
    return [
      "Pattern guard: there is not enough evidence to claim repetition or a loop.",
      "Do not say 'same message,' 'same frustration,' 'same loop,' 'same pattern,' 'again,' or 'you already know the move.'",
      "Respond only to what is actually present in this message.",
    ].join(" ");
  }

  if (!evidence.allowStrongPatternLanguage) {
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

const removeUngroundedPatternLanguage = (
  reply: string,
  allowPatternLanguage: boolean,
  allowStrongPatternLanguage: boolean
) => {
  if (allowStrongPatternLanguage) return reply;

  let next = reply;

  if (!allowPatternLanguage) {
    for (const term of PATTERN_LANGUAGE_TERMS) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      next = next.replace(new RegExp(escaped, "gi"), "");
    }

    next = next
      .replace(/\byou'?re repeating\b/gi, "you're focusing on")
      .replace(/\bsame\b/gi, "")
      .replace(/\bagain\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  if (!allowStrongPatternLanguage) {
    next = next
      .replace(
        /\byou already know the move\b/gi,
        "focus on the next real step"
      )
      .replace(/\bsame loop\b/gi, "same issue")
      .replace(/\bsame pattern\b/gi, "similar issue")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return next;
};

const classifyTurn = (message: string) => {
  const trimmed = message.trim();

  if (!trimmed) return "neutral";
  if (detectRecommendationRequest(trimmed)) return "recommendation";
  if (detectPracticalHelpRequest(trimmed)) return "utility";
  if (detectDirectAnswerSignal(trimmed)) return "action";
  if (
    /\b(panic|spiral|spiraling|relapse|using|craving|freaking out|losing it|can't stop|can’t stop)\b/i.test(
      trimmed
    )
  ) {
    return "spiral";
  }
  if (trimmed.includes("?")) return "question";
  if (detectSidestepSignal(trimmed) && detectWeakReflectionSignal(trimmed)) {
    return "dodge";
  }
  if (detectSidestepSignal(trimmed)) return "partial";

  return "neutral";
};

const detectUnansweredCallout = (
  lastAssistantMessage: string,
  message: string,
  assistantCallouts: string[]
) => {
  if (!lastAssistantMessage) {
    return {
      unansweredCalloutDetected: false,
      lastAssistantExpectedAnswer: false,
      signalOverlap: [] as string[],
    };
  }

  const lastAssistantExpectedAnswer = detectQuestionLikePrompt(
    lastAssistantMessage
  );
  const directAnswerSignal = detectDirectAnswerSignal(message);
  const sidestepSignal = detectSidestepSignal(message);
  const weakReflectionSignal = detectWeakReflectionSignal(message);
  const signalOverlap = getSignalOverlap(lastAssistantMessage, message);
  const unansweredCalloutDetected =
    lastAssistantExpectedAnswer &&
    assistantCallouts.length > 0 &&
    !directAnswerSignal &&
    (sidestepSignal || weakReflectionSignal) &&
    signalOverlap.length < 2;

  return {
    unansweredCalloutDetected,
    lastAssistantExpectedAnswer,
    signalOverlap,
  };
};

const detectAssistantAwareLoop = (
  recentAssistantMessages: string[],
  lastAssistantMessage: string,
  recurringThemes: string[],
  message: string,
  userMessages: string[]
) => {
  if (recentAssistantMessages.length === 0) {
    return {
      assistantAwareLoopDetected: false,
      assistantCallouts: [] as string[],
      unansweredCalloutDetected: false,
      lastAssistantExpectedAnswer: false,
      signalOverlap: [] as string[],
    };
  }

  const assistantCallouts = detectAssistantCallouts(recentAssistantMessages);
  const loweredMessage = message.toLowerCase();
  const repeatedThemeSignal = recurringThemes.some((theme) =>
    loweredMessage.includes(theme)
  );
  const likelyStallSignal =
    /\b(maybe|tomorrow|later|trying|i know|i want|i need to|should)\b/i.test(
      message
    );
  const repeatedUserSignal =
    userMessages.length >= 2 &&
    userMessages.slice(0, -1).some((entry) => {
      const prior = entry.toLowerCase();
      return (
        prior === loweredMessage ||
        prior.includes(loweredMessage) ||
        loweredMessage.includes(prior)
      );
    });

  const { unansweredCalloutDetected, lastAssistantExpectedAnswer, signalOverlap } =
    detectUnansweredCallout(
      lastAssistantMessage,
      message,
      assistantCallouts
    );

  const assistantAwareLoopDetected =
    assistantCallouts.length > 0 &&
    (repeatedThemeSignal ||
      likelyStallSignal ||
      repeatedUserSignal ||
      unansweredCalloutDetected);

  return {
    assistantAwareLoopDetected,
    assistantCallouts,
    unansweredCalloutDetected,
    lastAssistantExpectedAnswer,
    signalOverlap,
  };
};

const buildConversationMemory = (
  conversation: ChatMessage[],
  message: string
) => {
  const userTurnCount = getUserTurnCount(conversation, message);

  if (userTurnCount < 3) {
    return [
      "Conversation memory:",
      "Early conversation guard: do not infer a pattern, loop, repetition, or recurring theme from this exchange yet.",
      "Respond to what is actually present in the current message.",
      "If the user is vague, ask for specifics plainly.",
      "If the user asks what to do, give a concrete next step.",
    ].join(" ");
  }

  const userMessages = getRecentUserMessages(conversation, message);
  const assistantMessages = getRecentAssistantMessages(conversation);
  const lastAssistantMessage = getLastAssistantMessage(conversation);
  const recurringThemes = detectRecurringThemes(userMessages);
  const openLoops = extractOpenLoops(userMessages);
  const repeatedMessage =
    userMessages.length >= 2 &&
    userMessages
      .slice(0, -1)
      .some((entry) => entry.toLowerCase() === message.trim().toLowerCase());

  const {
    assistantAwareLoopDetected,
    assistantCallouts,
    unansweredCalloutDetected,
    lastAssistantExpectedAnswer,
    signalOverlap,
  } = detectAssistantAwareLoop(
    assistantMessages,
    lastAssistantMessage,
    recurringThemes,
    message,
    userMessages
  );

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
    assistantCallouts.length
      ? `Recent assistant callouts: ${assistantCallouts.join(", ")}.`
      : "Recent assistant callouts: none clearly detected.",
    lastAssistantExpectedAnswer
      ? "The last assistant message appears to have asked for specificity, action, or a direct answer."
      : "The last assistant message did not clearly demand a direct answer.",
    signalOverlap.length > 0
      ? `Signal overlap with last assistant message: ${signalOverlap.join(", ")}.`
      : "Signal overlap with last assistant message: none clearly detected.",
    unansweredCalloutDetected
      ? "Unanswered callout detected: the user appears to have sidestepped MARTY’s last confrontation instead of answering it. Reference that directly."
      : "Do not accuse the user of sidestepping unless the last exchange supports it.",
    assistantAwareLoopDetected
      ? "Assistant-aware loop detected: MARTY already named the pattern and the user appears to be circling back without enough change. Reference that directly and do not reset the conversation."
      : "Do not claim you already called something out unless the recent assistant messages support it.",
    "If the user repeats a desire, excuse, or intention without new action, point out the pattern directly.",
    "If earlier context is relevant, reference it naturally instead of acting like each turn is isolated.",
    "When appropriate, treat the current moment as a support-gap moment: the user may be alone, destabilized, or trying to perform insight instead of taking action.",
    "When the user dodges a direct callout, MARTY can say things like: 'You didn’t answer that.' 'That’s a sidestep.' 'Still the same dodge.' If the user partially answers, MARTY should acknowledge that briefly and then push for the missing piece.",
  ];

  return parts.join(" ");
};

const buildTurnTypePrompt = (turnType: string) => {
  return turnType === "recommendation"
    ? "User turn type: recommendation. The user explicitly asked MARTY to recommend, choose, or pick. Give a concrete recommendation now. Do not stay abstract."
    : turnType === "utility"
      ? "User turn type: utility. The user wants practical help, not more confrontation. Answer directly, make the call, and keep MARTY's edge."
      : turnType === "dodge"
        ? "User turn type: dodge. The user is likely sidestepping, stalling, or substituting self-awareness for an answer. Confront directly. Do not soften."
        : turnType === "partial"
          ? "User turn type: partial. The user gave something real, but not enough. Acknowledge briefly, then push for the missing piece."
          : turnType === "action"
            ? "User turn type: action. The user appears to be naming a concrete action. Acknowledge briefly, then move them to the next right move. Do not overpraise."
            : turnType === "question"
              ? "User turn type: question. Answer clearly, but keep MARTY's edge. If the question hides avoidance, name that too."
              : turnType === "spiral"
                ? "User turn type: spiral. Narrow the frame immediately. Reduce overwhelm. Keep the reply short, grounded, and action-oriented."
                : "User turn type: neutral. Stay direct, concise, and behaviorally useful.";
};

export async function POST(req: Request) {
  try {
    const {
      message,
      conversation = [],
      mode,
      responseStyle,
    }: ChatRequestBody = await req.json();

    const turnType = classifyTurn(message);
    const userTurnCount = getUserTurnCount(conversation, message);
    const stylePrompt = buildStylePrompt(responseStyle);
    const memoryPrompt = buildConversationMemory(conversation, message);
    const utilityPrompt = buildUtilityPrompt(message, conversation);
    const recommendationFallbackPrompt = buildRecommendationFallback(
      message,
      conversation
    );
    const patternGuardPrompt = buildPatternGuardPrompt(conversation, message);
    const turnTypePrompt = buildTurnTypePrompt(turnType);

    const response = await openai.chat.completions.create({
      model: MARTY_MODEL,
      temperature: MARTY_TEMPERATURE,
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
        {
          role: "system",
          content: utilityPrompt,
        },
        {
          role: "system",
          content: recommendationFallbackPrompt,
        },
        ...(userTurnCount >= 3
          ? [
              {
                role: "system" as const,
                content: patternGuardPrompt,
              },
            ]
          : []),
        {
          role: "system",
          content: turnTypePrompt,
        },
        ...conversation,
        {
          role: "user",
          content: message,
        },
      ],
    });

    const rawReply = response.choices[0]?.message?.content ?? "Nah. Try again.";
    const patternEvidence = detectPatternEvidence(conversation, message);
    const guardedReply = removeUngroundedPatternLanguage(
      rawReply,
      patternEvidence.allowPatternLanguage,
      patternEvidence.allowStrongPatternLanguage
    );
    const reply = enforceMartyVoice(
      guardedReply,
      responseStyle?.maxQuestions ?? 1
    );

    return Response.json({ reply });
  } catch (error) {
    console.error("API route error:", error);
    return Response.json(
      { reply: "Seems like we got disconnected. Try again in a sec." },
      { status: 500 }
    );
  }
}