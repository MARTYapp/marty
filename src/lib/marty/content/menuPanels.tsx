

import type { ReactNode } from "react";

type MenuPanelFactoryArgs = {
  feedbackEmail: string;
  onGeneralFeedbackEmail: () => void;
  onReplyFeedback: () => void;
  feedbackCopied: boolean;
  hasLatestMartyReply: boolean;
};

export type PanelKey =
  | "what-this-is"
  | "how-to-use-this"
  | "privacy"
  | "give-feedback";

export type MenuItem = {
  label: string;
  description: string;
  content: ReactNode;
};

export function buildMenuItems({
  feedbackEmail,
  onGeneralFeedbackEmail,
  onReplyFeedback,
  feedbackCopied,
  hasLatestMartyReply,
}: MenuPanelFactoryArgs): Record<PanelKey, MenuItem> {
  return {
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
            Share what is needed for the moment. Skip anything you would not
            want floating around in a product you are still shaping.
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
          <p>Send screenshots + what happened.</p>

          <p>When you send feedback, include:</p>

          <ul className="list-disc space-y-2 pl-5 text-white/82">
            <li>What was happening when you opened MARTY</li>
            <li>1–2 screenshots</li>
            <li>Did anything change after using it?</li>
          </ul>

          <div className="space-y-3">
            <p>That is how this gets sharp.</p>

            <div className="border-t border-white/8 pt-3">
              <p className="text-sm text-white/60">Send it to:</p>
              <button
                onClick={onGeneralFeedbackEmail}
                className="mt-1 inline-flex border-0 bg-transparent p-0 text-sm font-medium text-blue-300 underline decoration-blue-400/40 underline-offset-4 transition hover:text-blue-200"
                type="button"
              >
                {feedbackEmail}
              </button>
            </div>

            <div className="border-t border-white/8 pt-4">
              <p className="text-sm leading-6 text-white/60">
                One tap: copy the last MARTY reply and open an email draft.
              </p>

              <button
                onClick={onReplyFeedback}
                className="mt-3 inline-flex items-center justify-center rounded-full border border-blue-300/18 bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:brightness-110"
                type="button"
              >
                Copy last reply + email feedback
              </button>

              <p className="mt-2 text-xs text-white/45">
                {feedbackCopied
                  ? "Last MARTY reply copied."
                  : hasLatestMartyReply
                    ? "Uses the latest MARTY reply from this chat."
                    : "No MARTY reply yet — it will still open the email draft."}
              </p>
            </div>
          </div>
        </>
      ),
    },
  };
}