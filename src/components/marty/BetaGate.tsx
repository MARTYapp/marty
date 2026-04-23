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
      <div className="flex w-full max-w-180 flex-col overflow-hidden rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,30,0.98)_0%,rgba(8,12,21,0.98)_100%)] shadow-[0_30px_120px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
        <div className="border-b border-white/8 px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="bg-linear-to-r from-blue-200 via-blue-300 to-blue-500 bg-clip-text text-[10px] font-medium uppercase tracking-[0.28em] text-transparent sm:text-[11px]">
            MARTY Beta
          </p>
        </div>

        <div className="space-y-3.5 px-4 py-4 text-[13.5px] leading-5.5 text-white/84 sm:px-5 sm:py-5 sm:text-[14px] sm:leading-6">
          <div className="space-y-2">
            <p>This is not therapy. This is not journaling.</p>
            <p>
              Use this when something is actually happening — not when you’re
              calm and thinking about life.
            </p>
          </div>

          <div className="space-y-2">
            <p>Try it:</p>
            <ul className="list-disc space-y-1 pl-5 text-white/82">
              <li>when you’re spiraling</li>
              <li>when you’re about to do something you’ll regret</li>
              <li>when you’re avoiding something</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p>Don’t perform. Don’t try to sound good.</p>
            <p>Start with what’s true.</p>
          </div>

          <div className="space-y-1.5 border-t border-white/8 pt-3">
            <p className="text-[12.5px] leading-5 text-white/72 sm:text-sm">
              Send screenshots + what happened:
            </p>
            <button
              onClick={onFeedback}
              className="inline-flex border-0 bg-transparent p-0 text-[13px] font-medium text-blue-200 underline decoration-blue-400/30 underline-offset-4 transition hover:text-white sm:text-sm"
              type="button"
            >
              {FEEDBACK_EMAIL}
            </button>
          </div>

          <button
            onClick={onStart}
            className="inline-flex w-full items-center justify-center rounded-full border border-blue-300/18 bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] px-4 py-3 text-[15px] font-medium text-white shadow-[0_12px_30px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:brightness-110"
            type="button"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}