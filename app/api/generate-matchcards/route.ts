import { flashcardSchema, flashcardsSchema } from "@/lib/matchCardSchema";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { files } = await req.json();
  const firstFile = files[0].data;

  const result = streamObject({
    model: google("gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content: `You are a teacher creating interactive flashcards. Generate 6 question-answer flashcards from the document.

For question-answer cards:
- Create clear, focused questions about key concepts
- Provide concise but comprehensive answers
- Progress from basic to more advanced concepts
- Each answer should be concise (under 200 characters)

Ensure each card has a relevant category/topic label. Aim for approximately 6 cards of each type.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Create a mix of fill-in-the-blank and Q&A flashcards based on this document's content. For fill-in-blanks, focus on comparing and contrasting concepts using multiple blanks.",
          },
          {
            type: "file",
            data: firstFile,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    schema: flashcardSchema,
    output: "array",
    onFinish: ({ object }) => {
      const res = flashcardsSchema.safeParse(object);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join("\n"));
      }
      
      // Validate we have a mix of both types
      const cards = res.data;
      if (cards.length !== 6) {
        throw new Error(`Expected 7 cards but got ${cards.length}`);
      }

      // Validate all cards are QA type
      if (!cards.every(card => card.type === "qa")) {
        throw new Error("All cards must be question-answer type");
      }
    },
  });

  return result.toTextStreamResponse();
}