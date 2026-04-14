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
      "If a question is not necessary, do not ask one.",
      "Never ask more than one question mark in a reply unless the user explicitly asks for brainstorming or multiple options.",
    ].join(" ");
  };