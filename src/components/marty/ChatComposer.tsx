import type { KeyboardEventHandler, RefObject } from "react";

type ChatComposerProps = {
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  loading: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onInputResize: (target: HTMLTextAreaElement) => void;
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onSend: () => void;
};

export default function ChatComposer({
  input,
  inputRef,
  loading,
  onChange,
  onFocus,
  onInputResize,
  onKeyDown,
  onSend,
}: ChatComposerProps) {
  return (
    <footer className="relative z-10 shrink-0 border-t border-white/8 bg-[linear-gradient(180deg,rgba(7,10,17,0.88)_0%,rgba(5,7,11,0.96)_100%)] p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-2xl sm:px-6 sm:py-4">
      <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-2 backdrop-blur-xl sm:gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          rows={1}
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          enterKeyHint="send"
          placeholder="Text MARTY..."
          className="min-w-0 max-h-40 flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-base leading-6 text-white outline-none placeholder:text-white/35 sm:px-3 sm:py-2.5"
          onInput={(e) => onInputResize(e.currentTarget)}
          onKeyDown={onKeyDown}
        />

        <button
          onClick={onSend}
          disabled={loading}
          className="shrink-0 rounded-full border border-blue-300/18 bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:brightness-110 disabled:opacity-50 sm:px-5 sm:py-3"
          type="button"
        >
          Send
        </button>
      </div>
    </footer>
  );
}