import { openai } from "@/lib/marty/client/openai";
import {
  MARTY_MODEL,
  MARTY_TEMPERATURE,
} from "@/lib/marty/config/modelConfig";
import { buildStylePrompt } from "@/lib/marty/config/styleRules";
import { systemPrompt } from "@/lib/marty/config/systemPrompt";
import { enforceMartyVoice } from "@/lib/marty/postprocess/enforceMartyVoice";
import {
  buildConversationMemory,
  getUserTurnCount,
} from "@/lib/marty/memory/conversationMemory";
import {
  buildRecommendationFallback,
  buildTurnTypePrompt,
  buildUtilityPrompt,
  classifyTurn,
} from "@/lib/marty/intents/turnClassification";
import {
  buildPatternGuardPrompt,
  detectPatternEvidence,
  removeUngroundedPatternLanguage,
} from "@/lib/marty/policies/patternGuards";
import type { ChatRequestBody } from "@/lib/marty/types/chat";

export async function POST(req: Request) {
  try {
    const {
      message,
      conversation = [],
      mode,
      responseStyle,
    }: ChatRequestBody = await req.json();

    const turnType = classifyTurn(message);
    const userTurnCount = getUserTurnCount(conversation, message);

    const stylePrompt = buildStylePrompt(responseStyle);
    const memoryPrompt = buildConversationMemory(conversation, message);
    const utilityPrompt = buildUtilityPrompt(message, conversation);
    const recommendationFallbackPrompt = buildRecommendationFallback(
      message,
      conversation
    );

    const patternEvidence = detectPatternEvidence(conversation, message);
    const patternGuardPrompt = buildPatternGuardPrompt(
      patternEvidence.allowPatternLanguage,
      patternEvidence.allowStrongPatternLanguage
    );

    const turnTypePrompt = buildTurnTypePrompt(turnType);

    const response = await openai.chat.completions.create({
      model: MARTY_MODEL,
      temperature: MARTY_TEMPERATURE,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "system",
          content: `${stylePrompt} ${
            mode === "supportive-directive"
              ? "Be supportive, but do not get soft. Lead with clarity, then direction."
              : "Be direct and useful."
          }`,
        },
        {
          role: "system",
          content: memoryPrompt,
        },
        {
          role: "system",
          content: utilityPrompt,
        },
        {
          role: "system",
          content: recommendationFallbackPrompt,
        },
        ...(userTurnCount >= 3
          ? [
              {
                role: "system" as const,
                content: patternGuardPrompt,
              },
            ]
          : []),
        {
          role: "system",
          content: turnTypePrompt,
        },
        ...conversation,
        {
          role: "user",
          content: message,
        },
      ],
    });

    const rawReply =
      response.choices[0]?.message?.content ?? "Nah. Try again.";

    const guardedReply = removeUngroundedPatternLanguage(
      rawReply,
      patternEvidence.allowPatternLanguage,
      patternEvidence.allowStrongPatternLanguage
    );

    const reply = enforceMartyVoice(
      guardedReply,
      responseStyle?.maxQuestions ?? 1
    );

    return Response.json({ reply });
  } catch (error) {
    console.error("API route error:", error);

    return Response.json(
      { reply: "Seems like we got disconnected. Try again in a sec." },
      { status: 500 }
    );
  }
}