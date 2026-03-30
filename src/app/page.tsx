"use client";

import { useEffect, useRef, useState } from "react";

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

export default function Page() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("marty_messages");

      if (saved) {
        try {
          return JSON.parse(saved) as Message[];
        } catch {
          // fall through to default state
        }
      }
    }

    return [
      {
        id: 1,
        sender: "marty",
        text: "What's going on?",
        time: "9:41 PM",
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    window.localStorage.setItem("marty_messages", JSON.stringify(messages));
  }, [messages]);

  const toApiConversation = (conversation: Message[]): ApiConversationMessage[] => {
    return conversation.slice(-12).map((message) => ({
      role: message.sender === "user" ? "user" : "assistant",
      content: message.text,
    }));
  };

  const fetchReply = async (
    userText: string,
    conversation: Message[]
  ) => {
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
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, reply]);
    } catch (error) {
      console.error(error);

      const fallback: Message = {
        id: Date.now() + 1,
        sender: "marty",
        text: "I’m here, but something broke on the back end.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();

    const newMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: userText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const nextMessages = [...messages, newMessage];

    setMessages(nextMessages);
    setInput("");

    fetchReply(userText, nextMessages);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row">
        <section className="flex w-full flex-col justify-between border-b border-white/10 bg-black/40 backdrop-blur-sm lg:w-[320px] lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 px-6 py-8">
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/45">
              MARTY
            </p>
            <h1 className="max-w-xs text-2xl font-semibold leading-tight">
              The accountability layer between impulse and consequence.
            </h1>

            <div className="mt-5 space-y-1 text-sm text-white/65">
              <p>Not therapy.</p>
              <p>Not journaling.</p>
              <p>Not vibes.</p>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/75">
              MARTY notices your patterns, calls you out, and keeps you honest.
              Start talking.
            </p>
          </div>

          <div className="hidden px-6 py-6 text-xs text-white/35 lg:block">
            Direct. Clear. Hard to bullshit.
          </div>
        </section>

        <section className="flex min-h-[70vh] flex-1 flex-col bg-black/20">
          <header className="border-b border-white/10 px-4 py-4 sm:px-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              MARTY
            </p>
            <h2 className="text-lg font-semibold">Not therapy. Still honest.</h2>
          </header>

          <section className="flex-1 space-y-3 overflow-y-auto px-4 py-6 sm:px-6">
            {messages.map((message) => {
              const isUser = message.sender === "user";

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[85%] sm:max-w-[80%]">
                    <div
                      className={`rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed sm:text-base ${
                        isUser
                          ? "bg-white text-black"
                          : "border border-white/10 bg-white/10 text-white"
                      }`}
                    >
                      {message.text}
                    </div>

                    <p
                      className={`mt-1 text-[11px] text-white/40 ${
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
                <div className="rounded-3xl border border-white/10 bg-white/10 px-5 py-3.5 text-[15px] text-white/60 sm:text-base">
                  ...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </section>

          <footer className="border-t border-white/10 p-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Text MARTY..."
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-white outline-none backdrop-blur-md placeholder:text-white/35 sm:text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-full bg-white px-5 py-3.5 text-sm text-black shadow-md transition hover:opacity-90 disabled:opacity-50 sm:px-6 sm:text-base"
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