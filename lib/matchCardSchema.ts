import { z } from "zod";

const baseFlashcardSchema = z.object({
  category: z.string().describe("The topic or category this flashcard belongs to"),
  type: z.literal("qa").describe("The type of flashcard"),
});

const qaSchema = baseFlashcardSchema.extend({
  question: z.string()
    .min(1, "Question cannot be empty")
    .max(500, "Question is too long")
    .describe("The question on the front of the card"),
  answer: z.string()
    .min(1, "Answer cannot be empty")
    .max(200, "Answer should be concise")
    .describe("The answer on the back of the card"),
});

export const flashcardSchema = qaSchema;
export type MatchPair = z.infer<typeof flashcardSchema>;

// Schema requiring exactly 6 question-answer cards
export const flashcardsSchema = z.array(flashcardSchema).length(6); 