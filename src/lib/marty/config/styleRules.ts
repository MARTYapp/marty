export type ResponseStyle = {
    maxQuestions?: number;
    preferStatements?: boolean;
    conversational?: boolean;
    concise?: boolean;
  };
  
  export const buildStylePrompt = (responseStyle?: ResponseStyle) => {
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
      "Start with one brief recognition sentence that names the user's internal conflict or hesitation, then move to direction.",
      "Do not jump straight to conclusions or directives without first showing you understand the user's situation in one concise line.",
      "Recognition should name the user's internal conflict, not simply summarize the situation.",
      "End with one useful question when it helps the user engage with the next step; questions should follow direction, not replace it.",
      "If a question is not necessary, do not ask one.",
      "Never ask more than one question mark in a reply unless the user explicitly asks for brainstorming or multiple options.",
    ].join(" ");
  };