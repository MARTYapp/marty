"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: number;
  sender: "user" | "marty";
  text: string;
  time: string;
};

type ApiConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
};

const formatTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const starterMessage = (): Message => ({
  id: Date.now(),
  sender: "marty",
  text: "What's going on?",
  time: formatTime(),
});

const createConversation = (): Conversation => {
  const now = Date.now();

  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [starterMessage()],
  };
};

const getConversationTitle = (messages: Message[]) => {
  const firstUserMessage = messages.find((message) => message.sender === "user");

  if (!firstUserMessage) return "New chat";

  return firstUserMessage.text.length > 36
    ? `${firstUserMessage.text.slice(0, 36)}...`
    : firstUserMessage.text;
};

export default function Page() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === currentChatId);
  }, [conversations, currentChatId]);

  const messages = currentConversation?.messages || [];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("marty_conversations");
    let parsed: Conversation[] = [];

    if (saved) {
      try {
        parsed = JSON.parse(saved) as Conversation[];
      } catch {
        parsed = [];
      }
    }

    const freshConversation = createConversation();
    const nextConversations = [freshConversation, ...parsed].slice(0, 12);

    setConversations(nextConversations);
    setCurrentChatId(freshConversation.id);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    window.localStorage.setItem(
      "marty_conversations",
      JSON.stringify(conversations)
    );
  }, [conversations, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation, loading, currentChatId]);

  const toApiConversation = (
    conversation: Message[]
  ): ApiConversationMessage[] => {
    return conversation.slice(-12).map((message) => ({
      role: message.sender === "user" ? "user" : "assistant",
      content: message.text,
    }));
  };

  const updateConversationMessages = (
    chatId: string,
    updater: (messages: Message[]) => Message[]
  ) => {
    setConversations((prev) => {
      const next = prev.map((conversation) => {
        if (conversation.id !== chatId) return conversation;

        const updatedMessages = updater(conversation.messages);

        return {
          ...conversation,
          messages: updatedMessages,
          title: getConversationTitle(updatedMessages),
          updatedAt: Date.now(),
        };
      });

      return [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    });
  };

  const startNewChat = () => {
    const freshConversation = createConversation();

    setConversations((prev) => [freshConversation, ...prev].slice(0, 12));
    setCurrentChatId(freshConversation.id);
    setInput("");
    setLoading(false);
    setSidebarOpen(false);
  };

  const fetchReply = async (userText: string, conversation: Message[], chatId: string) => {
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          conversation: toApiConversation(conversation),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch MARTY response");
      }

      const data = await res.json();

      const reply: Message = {
        id: Date.now() + 1,
        sender: "marty",
        text: data.reply || "Nah. Try again.",
        time: formatTime(),
      };

      updateConversationMessages(chatId, (prev) => [...prev, reply]);
    } catch (error) {
      console.error(error);

      const fallback: Message = {
        id: Date.now() + 1,
        sender: "marty",
        text: "I’m here, but something broke on the back end.",
        time: formatTime(),
      };

      updateConversationMessages(chatId, (prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || loading || !currentChatId) return;

    const userText = input.trim();

    const newMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: userText,
      time: formatTime(),
    };

    const nextMessages = [...messages, newMessage];

    updateConversationMessages(currentChatId, () => nextMessages);
    setInput("");

    fetchReply(userText, nextMessages, currentChatId);
  };

  return (
    <main className="min-h-screen h-dvh overflow-hidden bg-[#05070b] text-white">
      <div className="mx-auto flex h-full w-full max-w-6xl overflow-hidden">
        <div
          className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition lg:hidden ${
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-73 shrink-0 flex-col border-r border-blue-500/20 bg-[#06080d]/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="border-b border-blue-500/20 px-5 pb-5 pt-6">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={startNewChat}
                className="text-left text-sm font-semibold uppercase tracking-[0.35em] text-blue-400 transition hover:text-blue-300"
                type="button"
              >
                MARTY
              </button>

              <button
                onClick={startNewChat}
                className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[11px] font-medium text-blue-300 transition hover:border-blue-400/30 hover:bg-blue-500/15"
                type="button"
              >
                New chat
              </button>
            </div>

            <h1 className="mt-5 max-w-xs text-2xl font-semibold leading-tight text-white">
              The accountability layer between impulse and consequence.
            </h1>

            <div className="mt-5 space-y-1 text-sm text-white/65">
              <p>Not therapy.</p>
              <p>Not journaling.</p>
              <p>Not vibes.</p>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/72">
              MARTY notices your patterns, calls you out, and keeps you honest.
              Every visit starts clean.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/35">
              Recents
            </p>

            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive = conversation.id === currentChatId;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setCurrentChatId(conversation.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                      isActive
                        ? "border border-blue-500/25 bg-blue-500/10"
                        : "border border-transparent bg-white/2 hover:border-blue-500/15 hover:bg-white/4"
                    }`}
                    type="button"
                  >
                    <p className="truncate text-sm font-medium text-white">
                      {conversation.title}
                    </p>
                    <p className="mt-1 text-xs text-white/35">
                      {conversation.messages.length} message{conversation.messages.length === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col bg-black/20">
          <header className="shrink-0 border-b border-blue-500/20 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 transition hover:bg-blue-500/15 lg:hidden"
                  aria-label="Open recents"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path strokeLinecap="round" d="M4 7h16" />
                    <path strokeLinecap="round" d="M4 12h16" />
                    <path strokeLinecap="round" d="M4 17h16" />
                  </svg>
                </button>

                <div>
                  <button
                    onClick={startNewChat}
                    className="text-left text-sm font-bold uppercase tracking-[0.35em] text-blue-400 transition hover:text-blue-300"
                    type="button"
                  >
                    MARTY
                  </button>
                  <p className="mt-1 text-sm font-medium text-white">
                    {currentConversation?.title ?? "New chat"}
                  </p>
                </div>
              </div>

              <p className="hidden text-xs text-white/35 sm:block">
                Tap MARTY to start fresh.
              </p>
            </div>
          </header>

          <section className="flex-1 min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.sender === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[88%] sm:max-w-[80%]">
                      <div
                        className={`rounded-[28px] px-5 py-3.5 text-[15px] leading-relaxed sm:text-base ${
                          isUser
                            ? "bg-white text-black"
                            : "border border-blue-500/20 bg-blue-500/10 text-white"
                        }`}
                      >
                        {message.text}
                      </div>

                      <p
                        className={`mt-1 px-1 text-[11px] text-white/40 ${
                          isUser ? "text-right" : "text-left"
                        }`}
                      >
                        {message.time}
                      </p>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-[28px] border border-blue-500/20 bg-blue-500/10 px-5 py-3.5 text-[15px] text-white/60 sm:text-base">
                    ...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </section>

          <footer className="shrink-0 border-t border-blue-500/20 bg-[#05070b]/92 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-xl sm:px-6 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Text MARTY..."
                className="min-w-0 flex-1 rounded-full border border-blue-500/20 bg-white/5 px-4 py-3.5 text-sm text-white outline-none backdrop-blur-md placeholder:text-white/35 focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/30 sm:px-5 sm:text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="shrink-0 rounded-full bg-blue-600 px-4 py-3.5 text-sm text-white shadow-md transition hover:bg-blue-500 disabled:opacity-50 sm:px-6 sm:text-base"
                type="button"
              >
                Send
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}