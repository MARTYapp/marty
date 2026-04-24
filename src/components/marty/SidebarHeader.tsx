"use client";

type SidebarHeaderProps = {
  onNewChat: () => void;
  conversationCount?: number;
  currentTitle?: string;
};

export default function SidebarHeader({
  onNewChat,
  conversationCount = 0,
  currentTitle = "New chat",
}: SidebarHeaderProps) {
  const hasRecents = conversationCount > 1;
  const safeTitle = currentTitle && currentTitle !== "New chat" ? currentTitle : "Fresh session";

  return (
    <div className="border-b border-white/8 px-5 pt-6 pb-5">
      <div className="flex items-center justify-between gap-3">
        <span className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-left text-sm font-semibold uppercase tracking-[0.35em] text-transparent">
          MARTY
        </span>

        <span className="rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/38">
          Beta
        </span>
      </div>

      <h1 className="mt-4 max-w-xs text-[1.6rem] font-semibold leading-[1.1] text-white">
        The accountability layer between impulse and consequence.
      </h1>

      <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
        Calls you out. Tracks patterns. Keeps you honest.
      </p>

      <div className="mt-5 rounded-2xl border border-white/8 bg-white/2.5 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/32">
          Current
        </p>
        <p className="mt-1 truncate text-sm font-medium text-white/78">
          {safeTitle}
        </p>
        <p className="mt-1 text-xs leading-5 text-white/38">
          {hasRecents
            ? `${conversationCount} saved chats`
            : "Start clean. Use this when something’s actually happening."}
        </p>
      </div>

      <div className="mt-4">
        <button
          onClick={onNewChat}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-blue-400/30 hover:bg-blue-500/15 hover:text-blue-100"
          type="button"
        >
          New chat
        </button>
      </div>
    </div>
  );
}