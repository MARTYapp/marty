"use client";

import { useState } from "react";

type Message = {
  id: number;
  sender: "user" | "marty";
  text: string;
  time: string;
};

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "marty",
      text: "What's going on?",
      time: "9:41 PM",
    },
  ]);

  const [input, setInput] = useState("");

  const fetchReply = async (userText: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText }),
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
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;

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

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    fetchReply(userText);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-white/10 bg-black/40 backdrop-blur-sm">
        <header className="border-b border-white/10 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            MARTY
          </p>
          <h1 className="text-lg font-semibold">Not therapy. Still honest.</h1>
        </header>

        <section className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
          {messages.map((message) => {
            const isUser = message.sender === "user";

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%]">
                  <div
                    className={`rounded-3xl px-4 py-3 text-sm ${
                      isUser
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/10"
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
        </section>

        <footer className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Text MARTY..."
              className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />

            <button
              onClick={sendMessage}
              className="rounded-full bg-white px-4 py-2 text-sm text-black"
            >
              Send
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}