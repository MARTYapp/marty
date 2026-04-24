const stripBannedOpeners = (value: string) => {
  return value
    .replace(/^it sounds like\s*/i, "")
    .replace(/^that sounds like\s*/i, "")
    .replace(/^have you considered\s*/i, "")
    .replace(/^it’s understandable that\s*/i, "")
    .replace(/^it's understandable that\s*/i, "")
    .replace(/^i’m here for you[,.!\s]*/i, "")
    .replace(/^i'm here for you[,.!\s]*/i, "");
};

const preserveRecognition = (value: string) => {
  const sentences = value.split(/(?<=[.!?])\s+/);
  const first = sentences[0]?.trim();

  if (!first) return value;

  const looksLikeRecognition =
    /\b(you('|’)?re|you are|that|this|it)\b/i.test(first) &&
    /\b(conflicted|hesitating|hesitation|avoiding|avoidance|overwhelmed|stuck|scared|afraid|angry|hurt|off|real|heavy|not random|already know)\b/i.test(first);

  if (!looksLikeRecognition) return value;

  return [first, ...sentences.slice(1)].join(" ");
};

export const hardenTone = (value: string) => {
  let next = value.trim();

  next = stripBannedOpeners(next);
  next = preserveRecognition(next);

  next = next.replace(/\bI think\b/gi, "");
  next = next.replace(/\bmaybe\b/gi, "");
  next = next.replace(/\bperhaps\b/gi, "");
  next = next.replace(/\s{2,}/g, " ").trim();

  if (next.length > 260 && !next.includes("\n") && next.split(". ").length > 3) {
    next = next.split(". ").slice(0, 3).join(". ");
    if (!/[.!?]$/.test(next)) next += ".";
  }

  return next;
};