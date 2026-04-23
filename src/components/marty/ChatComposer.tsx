

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
      <div className="flex items-end gap-2 sm:gap-3">
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
          className="min-w-0 max-h-40 flex-1 resize-none overflow-y-auto rounded-3xl border border-white/10 bg-white/4.5 px-4 py-3 text-base leading-6 text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-md placeholder:text-white/28 focus:border-blue-400/28 focus:bg-white/6 focus:ring-1 focus:ring-blue-400/18 sm:px-5 sm:py-3.5"
          onInput={(e) => onInputResize(e.currentTarget)}
          onKeyDown={onKeyDown}
        />

        <button
          onClick={onSend}
          disabled={loading}
          className="shrink-0 rounded-full border border-blue-300/18 bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] px-4 py-3 text-base font-medium text-white shadow-[0_12px_30px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:brightness-110 disabled:opacity-50 sm:px-6 sm:py-3.5"
          type="button"
        >
          Send
        </button>
      </div>
    </footer>
  );
}