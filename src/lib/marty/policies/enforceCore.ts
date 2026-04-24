type PolicyInput = {
  reply: string;
};

const splitSentences = (text: string) => text.split(/(?<=[.!?])\s+/);

const isRecognition = (s: string) => {
  return (
    /\b(you('|’)?re|you are|that|this|it)\b/i.test(s) &&
    /\b(conflicted|hesitating|hesitation|avoiding|avoidance|overwhelmed|stuck|scared|afraid|angry|hurt|off|real|heavy|not random|already know)\b/i.test(s)
  );
};

export function enforceCore({ reply }: PolicyInput): string {
  let output = reply.trim();

  // Split to inspect first sentence
  const sentences = splitSentences(output);
  const first = sentences[0] || "";
  const rest = sentences.slice(1).join(" ");

  // 1. Strip soft / therapy-style openers (but DO NOT strip a valid recognition first line)
  const softOpeners = [
    "It sounds like",
    "I hear you",
    "That makes sense",
    "I understand",
    "It seems like",
  ];

  if (!isRecognition(first)) {
    softOpeners.forEach((phrase) => {
      const regex = new RegExp(`^${phrase}[,\\s]+`, "i");
      output = output.replace(regex, "");
    });
  } else {
    // Rebuild with preserved first sentence
    output = [first, rest].filter(Boolean).join(" ");
  }

  // 2. Kill over-questioning (max 1 question)
  const questionMatches = output.match(/\?/g) || [];
  if (questionMatches.length > 1) {
    let firstQ = true;
    output = output.replace(/\?/g, () => {
      if (firstQ) {
        firstQ = false;
        return "?";
      }
      return ".";
    });
  }

  // 3. Trim fluff
  output = output.replace(/\s+\n/g, "\n").trim();

  // 4. Force slightly sharper tone (keep, but don’t touch recognition wording)
  // Apply to the rest only if we have a preserved recognition
  if (isRecognition(first)) {
    let tail = rest
      .replace(/maybe/gi, "")
      .replace(/kind of/gi, "")
      .replace(/sort of/gi, "");
    output = [first, tail].filter(Boolean).join(" ").trim();
  } else {
    output = output
      .replace(/maybe/gi, "")
      .replace(/kind of/gi, "")
      .replace(/sort of/gi, "");
  }

  // 5. Keep it tight (max ~3 sentences)
  const sents = splitSentences(output);
  if (sents.length > 3) {
    output = sents.slice(0, 3).join(" ");
    if (!/[.!?]$/.test(output)) output += ".";
  }

  return output || "Say it straight.";
}