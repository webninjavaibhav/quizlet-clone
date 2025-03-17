import { z } from "zod";

const baseFlashcardSchema = z.object({
  category: z.string().describe("The topic or category this flashcard belongs to"),
  type: z.enum(["fillInBlank", "qa"]).describe("The type of flashcard"),
});

const fillInBlankSchema = baseFlashcardSchema.extend({
  type: z.literal("fillInBlank"),
  text: z.string().describe("The sentence with blanks marked as ____ for each missing word"),
  answers: z.array(z.string()).describe("The correct words in order of appearance"),
  hints: z.array(z.string()).optional().describe("Optional hints for each blank"),
});

const qaSchema = baseFlashcardSchema.extend({
  type: z.literal("qa"),
  question: z.string().describe("The question on the front of the card"),
  answer: z.string().describe("The answer on the back of the card"),
});

export const flashcardSchema = z.discriminatedUnion("type", [
  fillInBlankSchema,
  qaSchema,
]);

export type Flashcard = z.infer<typeof flashcardSchema>;
export type FillInBlankCard = z.infer<typeof fillInBlankSchema>;
export type QACard = z.infer<typeof qaSchema>;

export const flashcardsSchema = z.array(flashcardSchema).length(12); 