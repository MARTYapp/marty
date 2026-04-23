"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import BetaGate from "@/components/marty/BetaGate";
import ChatComposer from "@/components/marty/ChatComposer";
import InfoPanel from "@/components/marty/InfoPanel";
import MartyHeader from "@/components/marty/MartyHeader";
import MessageList from "@/components/marty/MessageList";
import SidebarHeader from "@/components/marty/SidebarHeader";
import SidebarRecents from "@/components/marty/SidebarRecents";
import {
  addMessageToConversation,
  type Conversation,
  createConversation,
  type Message,
  saveConversations,
  sortConversations,
  formatTime,
  loadConversations,
} from "@/lib/marty/helpers/conversation";
import {
  buildGeneralFeedbackBody,
  buildReplyFeedbackBody,
  FEEDBACK_EMAIL,
  openFeedbackDraft,
} from "@/lib/marty/helpers/feedback";
import {
  buildMenuItems,
  type PanelKey,
} from "@/lib/marty/content/menuPanels";

type ApiConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const RETURN_NUDGE_STORAGE_KEY = "marty-return-nudge-seen";

const normalizeReplyText = (value: string) => {
  return value.replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").trim();
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
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const [hasLoadedConversations, setHasLoadedConversations] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentConversation = useMemo(() => {
    return conversations.find(
      (conversation) => conversation.id === currentChatId
    );
  }, [conversations, currentChatId]);

  const messages = useMemo(() => {
    return currentConversation?.messages ?? [];
  }, [currentConversation]);

  const latestMartyReply = useMemo(() => {
    return [...messages].reverse().find((message) => message.sender === "marty");
  }, [messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  }, []);

  const handleGeneralFeedbackEmail = useCallback(() => {
    openFeedbackDraft("MARTY Feedback", buildGeneralFeedbackBody());
  }, []);

  const handleReplyFeedback = useCallback(async () => {
    const replyToCopy =
      latestMartyReply?.text || "No MARTY reply yet. Describe what happened.";

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(replyToCopy);
        setFeedbackCopied(true);
      } catch {
        setFeedbackCopied(false);
      }
    }

    openFeedbackDraft("MARTY Feedback", buildReplyFeedbackBody(replyToCopy));
  }, [latestMartyReply]);

  const menuItems = useMemo(
    () =>
      buildMenuItems({
        feedbackEmail: FEEDBACK_EMAIL,
        onGeneralFeedbackEmail: handleGeneralFeedbackEmail,
        onReplyFeedback: handleReplyFeedback,
        feedbackCopied,
        hasLatestMartyReply: Boolean(latestMartyReply),
      }),
    [
      feedbackCopied,
      handleGeneralFeedbackEmail,
      handleReplyFeedback,
      latestMartyReply,
    ]
  );

  useEffect(() => {
    const savedConversations = loadConversations();
    const savedReturnNudge =
      typeof window !== "undefined"
        ? window.localStorage.getItem(RETURN_NUDGE_STORAGE_KEY)
        : null;

    if (savedConversations.length > 0) {
      const sorted = sortConversations(savedConversations);
      setConversations(sorted);
      setCurrentChatId(sorted[0]?.id || "");
    } else {
      const freshConversation = createConversation();
      setConversations([freshConversation]);
      setCurrentChatId(freshConversation.id);
    }

    setBetaGateOpen(true);
    setHasSeenReturnNudge(Boolean(savedReturnNudge));
    setReturnNudgeVisible(Boolean(savedReturnNudge));
    setHasLoadedConversations(true);
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
    if (!hasLoadedConversations) return;
    if (!conversations.length) return;

    saveConversations(conversations);
  }, [conversations, hasLoadedConversations]);

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

  useEffect(() => {
    if (!feedbackCopied) return;

    const timeout = window.setTimeout(() => {
      setFeedbackCopied(false);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [feedbackCopied]);

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

  const updateConversationMessages = (
    chatId: string,
    updater: (messages: Message[]) => Message[]
  ) => {
    setConversations((prev) => addMessageToConversation(prev, chatId, updater));
  };

  const startNewChat = () => {
    const freshConversation = createConversation();
    const nextConversations = [freshConversation, ...conversations].slice(0, 12);

    setConversations(nextConversations);
    setCurrentChatId(freshConversation.id);
    setInput("");
    setLoading(false);
    setSidebarOpen(false);
    setMenuOpen(false);
    setActivePanel(null);
    setReturnNudgeVisible(false);
    setHasSeenReturnNudge(false);
    setFeedbackCopied(false);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(RETURN_NUDGE_STORAGE_KEY);
    }
  };

  const openPanel = (panel: PanelKey) => {
    setActivePanel(panel);
    setMenuOpen(false);
    setFeedbackCopied(false);
  };

  const closePanel = () => {
    setActivePanel(null);
    setFeedbackCopied(false);
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
          <SidebarHeader
            onNewChat={startNewChat}
            conversationCount={conversations.length}
            currentTitle={currentConversation?.title}
          />

          <SidebarRecents
            conversations={conversations}
            currentChatId={currentChatId}
            onSelectChat={(id) => {
              setCurrentChatId(id);
              setSidebarOpen(false);
            }}
          />
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

          <BetaGate
            open={betaGateOpen}
            onStart={handleStartBeta}
            onFeedback={handleGeneralFeedbackEmail}
          />

          <InfoPanel
            activePanel={activePanel}
            menuItems={menuItems}
            onClose={closePanel}
          />

          <MartyHeader
            onOpenSidebar={() => setSidebarOpen(true)}
            menuOpen={menuOpen}
            menuRef={menuRef}
            menuItems={menuItems}
            onToggleMenu={() => setMenuOpen((prev) => !prev)}
            onOpenPanel={openPanel}
          />

          <section
            ref={scrollContainerRef}
            className="relative z-0 min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 sm:pb-28"
          >
            <MessageList
              messages={messages}
              loading={loading}
              returnNudgeVisible={returnNudgeVisible}
              bottomRef={bottomRef}
            />
          </section>

          <ChatComposer
            input={input}
            inputRef={inputRef}
            loading={loading}
            onChange={setInput}
            onFocus={handleComposerFocus}
            onInputResize={autoResizeTextarea}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            onSend={sendMessage}
          />
        </section>
      </div>
    </main>
  );
}