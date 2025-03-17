import { flashcardSchema, flashcardsSchema } from "@/lib/flashcardSchema";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { files } = await req.json();
  const firstFile = files[0].data;

  const result = streamObject({
    model: google("gemini-1.5-pro-latest"),
    messages: [
      {
        role: "system",
        content: `You are a teacher creating interactive flashcards. Generate 12 flashcards from the document, with a mix of fill-in-the-blank and question-answer formats.

For fill-in-the-blank cards:
- Create sentences with multiple blanks marked as ____ (four underscores)
- Each blank should be a key term or concept from the text
- Provide an array of answers in order of appearance
- Example format:
  {
    "type": "fillInBlank",
    "text": "Corporations have ____ liability whereas sole proprietorships have ____ liability",
    "answers": ["limited", "unlimited"],
    "category": "Business Structures"
  }

For question-answer cards:
- Create clear, focused questions about key concepts
- Provide concise but comprehensive answers
- Progress from basic to more advanced concepts

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
      const fillInBlankCount = cards.filter(c => c.type === "fillInBlank").length;
      const qaCount = cards.filter(c => c.type === "qa").length;
      
      if (fillInBlankCount === 0 || qaCount === 0) {
        throw new Error("Generated cards must include both fill-in-blank and Q&A types");
      }

      // Validate fill-in-blank cards have matching answers
      cards.forEach(card => {
        if (card.type === "fillInBlank") {
          const blankCount = (card.text.match(/____/g) || []).length;
          if (blankCount !== card.answers.length) {
            throw new Error("Number of blanks must match number of answers");
          }
        }
      });
    },
  });

  return result.toTextStreamResponse();
} 