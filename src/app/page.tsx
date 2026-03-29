export default function Page() {
  const messages = [
    {
      id: 1,
      sender: "marty",
      text: "Say it out loud.",
      time: "9:41 PM",
    },
    {
      id: 2,
      sender: "user",
      text: "I think I’m sabotaging my relationships again.",
      time: "9:42 PM",
    },
    {
      id: 3,
      sender: "marty",
      text: "Maybe.\nWhat happened this time?",
      time: "9:42 PM",
    },
    {
      id: 4,
      sender: "user",
      text: "I pulled away before he could get too close.",
      time: "9:43 PM",
    },
    {
      id: 5,
      sender: "marty",
      text: "So you left first.\nThat’s not protection if it keeps costing you intimacy.",
      time: "9:43 PM",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-white/10 bg-black/40 backdrop-blur-sm">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 px-4 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                MARTY
              </p>
              <h1 className="text-lg font-semibold">Not therapy. Still honest.</h1>
            </div>
            <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
              online
            </div>
          </div>
        </header>

        <section className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
          <div className="mx-auto w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
            Tonight
          </div>

          {messages.map((message) => {
            const isUser = message.sender === "user";

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[82%]">
                  <div
                    className={`rounded-3xl px-4 py-3 text-[15px] leading-relaxed shadow-lg ${
                      isUser
                        ? "rounded-br-md bg-white text-black"
                        : "rounded-bl-md border border-white/10 bg-white/10 text-white"
                    }`}
                  >
                    {message.text.split("\n").map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                  <p
                    className={`mt-1 px-2 text-[11px] text-white/35 ${
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

        <footer className="sticky bottom-0 border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md">
          <div className="flex items-end gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10">
              +
            </button>

            <div className="flex-1 rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/40">
              Text MARTY...
            </div>

            <button className="rounded-full bg-white px-4 py-3 text-sm font-medium text-black transition hover:scale-[1.02]">
              Send
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}