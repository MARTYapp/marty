import type { MouseEventHandler } from "react";

const FEEDBACK_EMAIL = "themartyapp@gmail.com";

type BetaGateProps = {
  open: boolean;
  onStart: () => void;
  onFeedback: MouseEventHandler<HTMLButtonElement>;
};

export default function BetaGate({
  open,
  onStart,
  onFeedback,
}: BetaGateProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-90 flex items-center justify-center bg-[#03050b]/78 px-3 py-3 backdrop-blur-md sm:px-5 sm:py-5">
      <div className="flex w-full max-w-105 sm:max-w-125 flex-col overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,30,0.98)_0%,rgba(8,12,21,0.98)_100%)] shadow-[0_30px_120px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
        <div className="border-b border-white/8 px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-[11px] font-medium uppercase tracking-[0.28em] text-transparent sm:text-[12px]">
            MARTY Beta
          </p>
        </div>

        <div className="space-y-4 px-5 pt-5 pb-6 text-[14.5px] leading-6 text-white/80 sm:px-5 sm:py-5 sm:text-[15.5px] sm:leading-7">
          <div className="space-y-2">
            <p className="text-white/95">This is not therapy. This is not journaling.</p>
            <p className="text-white/80">
              Use this when something is actually happening — not when you’re
              calm and thinking about life.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-white/90">Try it:</p>
            <ul className="list-disc space-y-1 pl-5 text-white/75">
              <li>when you’re spiraling</li>
              <li>when you’re about to do something you’ll regret</li>
              <li>when you’re avoiding something</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-white/90">Don’t perform. Don’t try to sound good.</p>
            <p className="text-white/95">Start with what’s true.</p>
          </div>

          <div className="space-y-1.5 border-t border-white/8 pt-3">
            <p className="text-[13.5px] leading-5 text-white/72 sm:text-[14.5px]">
              Send screenshots + what happened:
            </p>
            <button
              onClick={onFeedback}
              className="inline-flex border-0 bg-transparent p-0 text-[14px] font-medium text-blue-200 underline decoration-blue-400/30 underline-offset-4 transition hover:text-white sm:text-[15px]"
              type="button"
            >
              {FEEDBACK_EMAIL}
            </button>
          </div>

          <button
            onClick={onStart}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-blue-300/18 bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] px-4 py-3.5 text-[16px] font-medium text-white shadow-[0_12px_30px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:brightness-110"
            type="button"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}