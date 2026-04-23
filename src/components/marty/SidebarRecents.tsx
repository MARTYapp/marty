import type { Conversation } from "@/lib/marty/helpers/conversation";

type SidebarRecentsProps = {
  conversations: Conversation[];
  currentChatId: string;
  onSelectChat: (id: string) => void;
};

export default function SidebarRecents({
  conversations,
  currentChatId,
  onSelectChat,
}: SidebarRecentsProps) {
  if (!conversations.length) return null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/28">
        Recents
      </p>

      <div className="space-y-1">
        {conversations.map((conversation) => {
          const isActive = conversation.id === currentChatId;

          return (
            <button
              key={conversation.id}
              onClick={() => onSelectChat(conversation.id)}
              className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                isActive
                  ? "border border-blue-400/20 bg-[linear-gradient(180deg,rgba(59,130,246,0.12)_0%,rgba(59,130,246,0.06)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  : "border border-transparent bg-white/2 hover:border-white/8 hover:bg-white/4.5"
              }`}
              type="button"
            >
              <p className="truncate text-sm font-medium text-white">
                {conversation.title}
              </p>
              <p className="mt-1 text-xs text-white/35">
                {conversation.messages.length} message
                {conversation.messages.length === 1 ? "" : "s"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}