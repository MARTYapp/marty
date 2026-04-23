

export type Message = {
  id: number;
  sender: "user" | "marty";
  text: string;
  time: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
};

export const CONVERSATIONS_STORAGE_KEY = "marty-conversations";

export const formatTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export const starterMessage = (): Message => ({
  id: Date.now(),
  sender: "marty",
  text: "Start with what’s true, not what sounds good.",
  time: formatTime(),
});

export const createConversation = (): Conversation => {
  const now = Date.now();

  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [starterMessage()],
  };
};

export const getConversationTitle = (messages: Message[]) => {
  const firstUserMessage = messages.find((m) => m.sender === "user");

  if (!firstUserMessage) return "New chat";

  return firstUserMessage.text.length > 36
    ? `${firstUserMessage.text.slice(0, 36)}...`
    : firstUserMessage.text;
};

export const loadConversations = (): Conversation[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveConversations = (conversations: Conversation[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    CONVERSATIONS_STORAGE_KEY,
    JSON.stringify(conversations)
  );
};

export const sortConversations = (conversations: Conversation[]) => {
  return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
};

export const addMessageToConversation = (
  conversations: Conversation[],
  chatId: string,
  updater: (messages: Message[]) => Message[]
): Conversation[] => {
  const next = conversations.map((c) => {
    if (c.id !== chatId) return c;

    const updatedMessages = updater(c.messages);

    return {
      ...c,
      messages: updatedMessages,
      title: getConversationTitle(updatedMessages),
      updatedAt: Date.now(),
    };
  });

  return sortConversations(next);
};