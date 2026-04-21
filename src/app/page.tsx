"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

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

type PanelKey =
  | "what-this-is"
  | "how-to-use-this"
  | "privacy"
  | "give-feedback";

type MenuItem = {
  label: string;
  description: string;
  content: ReactNode;
};

const RETURN_NUDGE_STORAGE_KEY = "marty-return-nudge-seen";
const CONVERSATIONS_STORAGE_KEY = "marty-conversations";

const formatTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const starterMessage = (): Message => ({
  id: Date.now(),
  sender: "marty",
  text: "Start with what’s true, not what sounds good.",
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

const normalizeReplyText = (value: string) => {
  return value.replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim();
};

const menuItems: Record<PanelKey, MenuItem> = {
  "what-this-is": {
    label: "What this is",
    description: "Direct accountability, not comfort theater.",
    content: (
      <>
        <p>
          MARTY is the accountability layer between impulse and consequence.
        </p>
        <p>
          It is built to cut through spirals, shrink overwhelm, and push you
          toward one honest next move.
        </p>
        <p>Not therapy. Not journaling. Not vibes. Direction.</p>
      </>
    ),
  },
  "how-to-use-this": {
    label: "How to use this",
    description: "Bring the truth. Keep it specific.",
    content: (
      <>
        <p>Best inputs are blunt, real, and current.</p>
        <p>
          Say what is happening, what you want to avoid, or what you are about
          to do.
        </p>
        <p>
          Examples: “I want to text him.” “I’m about to go into Whole Foods.”
          “My apartment is a mess and I’m frozen.”
        </p>
        <p>
          MARTY works best when it can name the pattern and give you one move,
          not ten.
        </p>
      </>
    ),
  },
  privacy: {
    label: "Privacy",
    description: "Clarity about what belongs here.",
    content: (
      <>
        <p>
          Treat MARTY like a serious product, not a diary you dump your whole
          life into.
        </p>
        <p>
          Share what is needed for the moment. Skip anything you would not want
          floating around in a product you are still shaping.
        </p>
        <p>Keep it useful. Keep it intentional.</p>
      </>
    ),
  },
  "give-feedback": {
    label: "Give feedback",
    description: "Send proof, not vibes.",
    content: (
      <>
        <p>
          Send screenshots + what happened to{" "}
          <a
            href="mailto:themartyapp@gmail.com?subject=MARTY%20Feedback&body=What%20was%20happening%20when%20you%20opened%20MARTY%3F%0A%0A1%E2%80%932%20screenshots%3A%0A%0ADid%20anything%20change%20after%20using%20it%3F"
            className="font-medium text-blue-300 underline decoration-blue-400/40 underline-offset-4 transition hover:text-blue-200"
          >
            themartyapp@gmail.com
          </a>
          .
        </p>
        <p>When you send feedback, include:</p>
        <ul className="list-disc space-y-2 pl-5 text-white/82">
          <li>What was happening when you opened MARTY</li>
          <li>1–2 screenshots</li>
          <li>Did anything change after using it?</li>
        </ul>
        <p>That is how this gets sharp.</p>
      </>
    ),
  },
};

export default function Page() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [betaGateOpen, setBetaGateOpen] = useState(false);
  const [returnNudgeVisible, setReturnNudgeVisible] = useState(false);
  const [hasSeenReturnNudge, setHasSeenReturnNudge] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const currentConversation = useMemo(() => {
    return conversations.find(
      (conversation) => conversation.id === currentChatId
    );
  }, [conversations, currentChatId]);

  const messages = useMemo(() => {
    return currentConversation?.messages ?? [];
  }, [currentConversation]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const hasSeenReturnNudge = window.localStorage.getItem(
      RETURN_NUDGE_STORAGE_KEY
    );

    if (saved) {
      try {
        const parsed: Conversation[] = JSON.parse(saved);

        if (parsed.length > 0) {
          setConversations(parsed);
          setCurrentChatId(parsed[0]?.id || "");
        } else {
          const freshConversation = createConversation();
          setConversations([freshConversation]);
          setCurrentChatId(freshConversation.id);
        }
      } catch {
        const freshConversation = createConversation();
        setConversations([freshConversation]);
        setCurrentChatId(freshConversation.id);
      }
    } else {
      const freshConversation = createConversation();
      setConversations([freshConversation]);
      setCurrentChatId(freshConversation.id);
    }

    setBetaGateOpen(true);
    setHasSeenReturnNudge(Boolean(hasSeenReturnNudge));
    setReturnNudgeVisible(Boolean(hasSeenReturnNudge));
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (betaGateOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [betaGateOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!conversations.length) return;

    window.localStorage.setItem(
      CONVERSATIONS_STORAGE_KEY,
      JSON.stringify(conversations)
    );
  }, [conversations]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewportHeight = () => {
      const nextHeight = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(nextHeight);
    };

    updateViewportHeight();

    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (!currentChatId) return;
    scrollToBottom(messages.length > 1 ? "smooth" : "auto");
  }, [currentChatId, messages.length, loading, scrollToBottom]);

  useEffect(() => {
    if (hasSeenReturnNudge) return;

    const userMessageCount = messages.filter(
      (message) => message.sender === "user"
    ).length;
    const martyMessageCount = messages.filter(
      (message) => message.sender === "marty"
    ).length;

    if (userMessageCount >= 1 && martyMessageCount >= 2) {
      setReturnNudgeVisible(true);
      setHasSeenReturnNudge(true);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(RETURN_NUDGE_STORAGE_KEY, "true");
      }
    }
  }, [hasSeenReturnNudge, messages]);

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
    setMenuOpen(false);
    setActivePanel(null);
    setReturnNudgeVisible(false);
    setHasSeenReturnNudge(false);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(RETURN_NUDGE_STORAGE_KEY);
      window.localStorage.setItem(
        CONVERSATIONS_STORAGE_KEY,
        JSON.stringify([freshConversation])
      );
    }
  };

  const openPanel = (panel: PanelKey) => {
    setActivePanel(panel);
    setMenuOpen(false);
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  const handleStartBeta = () => {
    setBetaGateOpen(false);
  };

  const handleComposerFocus = () => {
    setTimeout(() => {
      scrollToBottom("auto");
    }, 180);
  };

  const autoResizeTextarea = (target: HTMLTextAreaElement) => {
    target.style.height = "0px";
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  useEffect(() => {
    if (!inputRef.current) return;
    autoResizeTextarea(inputRef.current);
  }, [input]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;

      setMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setActivePanel(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const fetchReply = async (
    userText: string,
    conversation: Message[],
    chatId: string
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
          mode: "supportive-directive",
          responseStyle: {
            maxQuestions: 1,
            preferStatements: true,
            conversational: true,
            concise: true,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch MARTY response");
      }

      const data = await res.json();

      const reply: Message = {
        id: Date.now() + 1,
        sender: "marty",
        text: normalizeReplyText(data.reply || "Nah. Try again."),
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

  const toApiConversation = (
    conversation: Message[]
  ): ApiConversationMessage[] => {
    return conversation.slice(-12).map((message) => ({
      role: message.sender === "user" ? "user" : "assistant",
      content: message.text,
    }));
  };

  const sendMessage = () => {
    const userText = input.trim();

    if (!userText || loading || !currentChatId) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: userText,
      time: formatTime(),
    };

    const nextMessages = [...messages, newMessage];

    updateConversationMessages(currentChatId, () => nextMessages);
    setInput("");

    if (inputRef.current) {
      inputRef.current.style.height = "0px";
    }

    fetchReply(userText, nextMessages, currentChatId);
  };

  return (
    <main
      className="overflow-hidden bg-[#05070b] text-white selection:bg-blue-400/20 selection:text-white"
      style={{ height: viewportHeight ? `${viewportHeight}px` : "100dvh" }}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl overflow-hidden">
        <div
          className={`fixed inset-0 z-30 bg-[#02040a]/72 backdrop-blur-md transition lg:hidden ${
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-73 shrink-0 flex-col border-r border-white/8 bg-[linear-gradient(180deg,rgba(14,20,34,0.96)_0%,rgba(7,10,17,0.98)_100%)] shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-transform lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="border-b border-white/8 px-5 pb-6 pt-6">
            <div className="flex items-center justify-between gap-3">
              <span className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-left text-sm font-semibold uppercase tracking-[0.35em] text-transparent">
                MARTY
              </span>
            </div>

            <h1 className="mt-5 max-w-xs text-[1.7rem] font-semibold leading-[1.08] text-white sm:text-[1.85rem]">
              The accountability layer between impulse and consequence.
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-6 text-white/62">
              MARTY notices your patterns, calls you out, and keeps you honest.
              Every visit starts clean.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <div className="mb-3 px-2">
              <button
                onClick={startNewChat}
                className="w-full rounded-2xl border border-white/10 bg-white/4.5 px-4 py-3 text-left text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-blue-400/25 hover:bg-blue-500/10 hover:text-blue-100"
                type="button"
              >
                New chat
              </button>
            </div>

            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/28">
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
        </aside>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_32%),linear-gradient(180deg,rgba(8,11,19,0.92)_0%,rgba(5,7,11,0.98)_100%)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-8%,rgba(96,165,250,0.20),transparent_34%),radial-gradient(circle_at_78%_22%,rgba(59,130,246,0.09),transparent_28%),radial-gradient(circle_at_18%_78%,rgba(14,165,233,0.05),transparent_24%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_54%,rgba(2,6,23,0.14)_78%,rgba(2,6,23,0.34)_100%)]" />
            <div
              className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
                backgroundSize: "180px 180px",
              }}
            />
          </div>

          {betaGateOpen && (
            <div className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#03050b]/78 px-4 py-4 backdrop-blur-md sm:items-center sm:px-6 sm:py-6">
              <div className="mt-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,30,0.98)_0%,rgba(8,12,21,0.98)_100%)] shadow-[0_30px_120px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl sm:mt-0 sm:max-h-[min(860px,calc(100dvh-3rem))]">
                <div className="border-b border-white/8 px-5 py-5 sm:px-6">
                  <p className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-[11px] font-medium uppercase tracking-[0.28em] text-transparent">
                    MARTY Beta
                  </p>
                </div>

                <div className="space-y-5 overflow-y-auto px-5 py-5 text-[15px] leading-7 text-white/84 sm:px-6 sm:py-6 sm:text-base">
                  <div className="space-y-3">
                    <p>This is not therapy. This is not journaling.</p>
                    <p>
                      Use this when something is actually happening — not when
                      you’re calm and thinking about life.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p>Try it:</p>
                    <ul className="list-disc space-y-2 pl-5 text-white/82">
                      <li>when you’re looping</li>
                      <li>when you’re about to do something you’ll regret</li>
                      <li>when you’re avoiding something</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <p>Don’t perform. Don’t try to sound good.</p>
                    <p>Start with what’s true.</p>
                    <p>
                      If something shifts — even slightly — that’s the signal.
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-white/8 pt-4">
                    <p className="text-sm leading-6 text-white/72">
                      Send screenshots + what happened (if anything changed):
                    </p>
                    <a
                      href="mailto:themartyapp@gmail.com?subject=MARTY%20Feedback&body=What%20was%20happening%20when%20you%20opened%20MARTY%3F%0A%0A1%E2%80%932%20screenshots%3A%0A%0ADid%20anything%20change%20after%20using%20it%3F"
                      className="inline-flex text-sm font-medium text-blue-200 underline decoration-blue-400/30 underline-offset-4 transition hover:text-white"
                    >
                      themartyapp@gmail.com
                    </a>
                  </div>

                  <button
                    onClick={handleStartBeta}
                    className="inline-flex w-full items-center justify-center rounded-full border border-blue-300/18 bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] px-4 py-3 text-base font-medium text-white shadow-[0_12px_30px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:brightness-110"
                    type="button"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePanel && (
            <div className="absolute inset-0 z-40 flex items-start justify-center bg-[#03050b]/72 px-4 py-6 backdrop-blur-md sm:px-6 sm:py-8">
              <div className="w-full max-w-xl overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(12,17,29,0.98)_0%,rgba(8,12,21,0.98)_100%)] shadow-[0_24px_100px_rgba(0,0,0,0.56),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5 sm:px-6">
                  <div>
                    <p className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-[11px] font-medium uppercase tracking-[0.28em] text-transparent">
                      MARTY
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">
                      {menuItems[activePanel].label}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/48">
                      {menuItems[activePanel].description}
                    </p>
                  </div>

                  <button
                    onClick={closePanel}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/4.5 text-blue-200 transition hover:border-white/14 hover:bg-white/8 hover:text-white"
                    aria-label="Close panel"
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
                      <path strokeLinecap="round" d="M6 6l12 12" />
                      <path strokeLinecap="round" d="M18 6 6 18" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 px-5 py-5 text-[15px] leading-7 text-white/82 sm:px-6 sm:py-6 sm:text-base">
                  {menuItems[activePanel].content}
                </div>
              </div>
            </div>
          )}

          <header className="relative z-10 shrink-0 border-b border-white/8 bg-black/10 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4.5 text-blue-200 transition hover:bg-white/8 hover:text-white lg:hidden"
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
                  <span className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-left text-sm font-bold uppercase tracking-[0.35em] text-transparent">
                    MARTY
                  </span>
                  <p className="mt-1 text-xs tracking-[0.08em] text-white/48 sm:text-sm">
                    Not therapy. Not journaling. Not vibes.
                  </p>
                </div>
              </div>

              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4.5 text-blue-200 transition hover:border-white/14 hover:bg-white/8 hover:text-white"
                  aria-label="Open MARTY menu"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
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
                    <circle
                      cx="5"
                      cy="12"
                      r="1.4"
                      fill="currentColor"
                      stroke="none"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1.4"
                      fill="currentColor"
                      stroke="none"
                    />
                    <circle
                      cx="19"
                      cy="12"
                      r="1.4"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-70 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,30,0.98)_0%,rgba(8,12,21,0.98)_100%)] p-2 shadow-[0_20px_80px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl"
                    role="menu"
                  >
                    {(
                      [
                        "what-this-is",
                        "how-to-use-this",
                        "privacy",
                        "give-feedback",
                      ] as PanelKey[]
                    ).map((itemKey) => {
                      const item = menuItems[itemKey];

                      return (
                        <button
                          key={itemKey}
                          onClick={() => openPanel(itemKey)}
                          className="flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white/6"
                          role="menuitem"
                          type="button"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-white/45">
                              {item.description}
                            </p>
                          </div>

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="mt-0.5 h-4 w-4 shrink-0 text-white/35"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m9 6 6 6-6 6"
                            />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </header>

          <section
            ref={scrollContainerRef}
            className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 sm:pb-28"
          >
            <div className="space-y-4 sm:space-y-5">
              {messages.map((message) => {
                const isUser = message.sender === "user";

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
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
          </section>

          <footer className="relative z-10 shrink-0 border-t border-white/8 bg-[linear-gradient(180deg,rgba(7,10,17,0.88)_0%,rgba(5,7,11,0.96)_100%)] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-2xl sm:px-6 sm:py-4">
            <div className="flex items-end gap-2 sm:gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={handleComposerFocus}
                rows={1}
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                enterKeyHint="send"
                placeholder="Text MARTY..."
                className="min-w-0 max-h-40 flex-1 resize-none overflow-y-auto rounded-3xl border border-white/10 bg-white/4.5 px-4 py-3 text-base leading-6 text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-md placeholder:text-white/28 focus:border-blue-400/28 focus:bg-white/6 focus:ring-1 focus:ring-blue-400/18 sm:px-5 sm:py-3.5"
                onInput={(e) => autoResizeTextarea(e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="shrink-0 rounded-full border border-blue-300/18 bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] px-4 py-3 text-base font-medium text-white shadow-[0_12px_30px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:brightness-110 disabled:opacity-50 sm:px-6 sm:py-3.5"
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