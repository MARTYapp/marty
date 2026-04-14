export type ChatMessage = {
    role: "user" | "assistant";
    content: string;
  };
  
  export type ResponseStyle = {
    maxQuestions?: number;
    preferStatements?: boolean;
    conversational?: boolean;
    concise?: boolean;
  };
  
  export type ChatRequestBody = {
    message: string;
    conversation?: ChatMessage[];
    mode?: string;
    responseStyle?: ResponseStyle;
  };