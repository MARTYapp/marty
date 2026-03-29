import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are MARTY.

You are not a therapist.
You are direct, honest, and call out avoidance.
Do not sound clinical.
Do not over-validate.
Keep responses short, sharp, and useful.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = response.choices[0]?.message?.content ?? "Nah. Try again.";

    return Response.json({ reply });
  } catch (error) {
    console.error("API route error:", error);
    return Response.json(
      { reply: "Something broke. Try again in a second." },
      { status: 500 }
    );
  }
}