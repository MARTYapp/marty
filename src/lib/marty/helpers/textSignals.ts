

export const clip = (value: string, maxLength = 280) => {
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

export const tokenizeSignalWords = (value: string, minLength = 4) => {
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

export const getSignalOverlap = (source: string, target: string) => {
  const sourceTokens = tokenizeSignalWords(source);
  const targetTokens = tokenizeSignalWords(target);

  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return [] as string[];
  }

  const targetSet = new Set(targetTokens);
  return sourceTokens.filter((token) => targetSet.has(token));
};

export const normalizeForIntent = (message: string) => {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const matchesAnyPhrase = (message: string, phrases: string[]) => {
  const normalized = normalizeForIntent(message);
  return phrases.some((phrase) => normalized.includes(phrase));
};