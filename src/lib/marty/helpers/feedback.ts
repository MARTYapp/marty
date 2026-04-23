

export const FEEDBACK_EMAIL = "themartyapp@gmail.com";

export const buildMailtoHref = (subject: string, body: string) => {
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
};

export const buildGeneralFeedbackBody = () => {
  return [
    "What was happening when you opened MARTY?",
    "",
    "1–2 screenshots:",
    "",
    "Did anything change after using it?",
  ].join("\n");
};

export const buildReplyFeedbackBody = (replyText: string) => {
  return [
    "Paste the reply here:",
    "",
    replyText,
    "",
    "What felt off:",
    "",
    "What should it have done:",
  ].join("\n");
};

export const openFeedbackDraft = (subject: string, body: string) => {
  if (typeof window === "undefined") return;

  window.location.href = buildMailtoHref(subject, body);
};