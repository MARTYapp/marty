import { cleanReply } from "./cleanReply";
import { hardenTone } from "./hardenTone";
import { capQuestions } from "./capQuestions";
import { enforceCore } from "@/lib/marty/policies/enforceCore";

export const enforceMartyVoice = (value: string, maxQuestions = 1) => {
  let next = cleanReply(value);
  next = hardenTone(next);
  next = capQuestions(next, maxQuestions);
  next = enforceCore({ reply: next });

  if (!next) return "Say it straight.";

  return next;
};