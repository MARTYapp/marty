

// Detects if user is spiraling (repeating emotional loops, indecision, overthinking)

const SPIRAL_KEYWORDS = [
  "again",
  "still",
  "same",
  "always",
  "never",
  "overthinking",
  "can't stop",
  "keep thinking",
  "loop",
  "spiral",
  "spiraling",
  "going in circles",
  "back here",
];

type SpiralingResult = {
  isSpiraling: boolean;
  confidence: number; // 0–1
  matches: string[];
};

export function detectSpiraling(input: string): SpiralingResult {
  const text = input.toLowerCase();

  const matches = SPIRAL_KEYWORDS.filter((keyword) =>
    text.includes(keyword)
  );

  const repeatPatterns = /\b(again|still|same)\b/g;
  const repeatCount = (text.match(repeatPatterns) || []).length;

  let confidence = matches.length * 0.15 + repeatCount * 0.2;

  if (confidence > 1) confidence = 1;

  return {
    isSpiraling: confidence >= 0.4,
    confidence,
    matches,
  };
}

// Optional helper for future: generates a callout line
export function getSpiralCallout(): string {
  return "Same loop. New wording.";
}