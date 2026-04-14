import { cleanReply } from "./cleanReply";
import { hardenTone } from "./hardenTone";
import { capQuestions } from "./capQuestions";

export const enforceMartyVoice = (value: string, maxQuestions = 1) => {
  let next = cleanReply(value);
  next = hardenTone(next);
  next = capQuestions(next, maxQuestions);

  if (!next) return "Say it straight.";

  return next;
};