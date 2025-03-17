import { flashcardSchema, flashcardsSchema } from "@/lib/flashcardSchema";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { files } = await req.json();
  const firstFile = files[0].data;

  const result = streamObject({
    model: google("gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content:
          "You are a teacher. Your job is to take a document, and create 8 flashcards based on the content of the document. Each flashcard should be a question-answer pair.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Create 8 flashcards based on this document.",
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
      // Update validation to expect 8 flashcards
      const eightFlashcardsSchema = z.array(flashcardSchema).length(8);
      const res = eightFlashcardsSchema.safeParse(object);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join("\n"));
      }
    },
  });

  return result.toTextStreamResponse();
} 