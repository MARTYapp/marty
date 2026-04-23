

type Message = {
  id: number;
  sender: "user" | "marty";
  text: string;
  time: string;
};

type MessageListProps = {
  messages: Message[];
  loading: boolean;
  returnNudgeVisible: boolean;
  bottomRef: React.RefObject<HTMLDivElement | null>;
};

export default function MessageList({
  messages,
  loading,
  returnNudgeVisible,
  bottomRef,
}: MessageListProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {messages.map((message) => {
        const isUser = message.sender === "user";

        return (
          <div
            key={message.id}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[90%] sm:max-w-[78%]">
              <div
                className={`rounded-[28px] px-4 py-3 text-[15px] leading-[1.62] shadow-[0_8px_30px_rgba(0,0,0,0.14)] sm:px-5 sm:py-3.5 sm:text-base ${
                  isUser
                    ? "border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,247,255,0.96)_100%)] text-black shadow-[0_10px_30px_rgba(0,0,0,0.16)]"
                    : "border border-white/10 bg-[linear-gradient(180deg,rgba(30,41,59,0.84)_0%,rgba(18,25,39,0.92)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.24)]"
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
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(30,41,59,0.84)_0%,rgba(18,25,39,0.92)_100%)] px-5 py-3.5 text-[15px] text-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_30px_rgba(0,0,0,0.24)] sm:text-base">
            MARTY is typing...
          </div>
        </div>
      )}

      {returnNudgeVisible && !loading && (
        <div className="flex justify-center pt-2">
          <p className="rounded-full border border-white/8 bg-white/[0.035] px-4 py-2 text-center text-xs tracking-[0.08em] text-white/46 backdrop-blur-sm">
            Come back when it’s real again.
          </p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}