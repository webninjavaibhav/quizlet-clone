"use client";

import { useState } from "react";
import { experimental_useObject } from "ai/react";
import { questionsSchema } from "@/lib/schemas";
import { flashcardsSchema } from "@/lib/flashcardSchema";
import { flashcardsSchema as matchCardsSchema, MatchPair } from "@/lib/matchCardSchema";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader2, BookOpen, ListChecks, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Quiz from "@/components/quiz";
import Flashcards from "@/components/Flashcards";
import MatchCards from "@/components/MatchCards";
import { generateQuizTitle } from "./actions";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "@/components/ui/header";
import { capitalizeFirst } from "@/lib/utils";
import { AnimatedBackground } from "@/components/ui/animated-background";

// Define available study modes
type StudyMode = "quiz" | "flashcards" | "matching";

export default function ChatWithFiles() {
  // State management for files and content
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<z.infer<typeof questionsSchema>>([]);
  const [flashcards, setFlashcards] = useState<z.infer<typeof flashcardsSchema>>([]);
  const [matchCards, setMatchCards] = useState<MatchPair[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();
  const [studyMode, setStudyMode] = useState<StudyMode>("quiz");
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [isMatchingComplete, setIsMatchingComplete] = useState(false);

  // Quiz generation hook
  const {
    submit: submitQuiz,
    object: partialQuestions,
    isLoading: isLoadingQuiz,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: questionsSchema,
    initialValue: [],
    onError: (error) => {
      toast.error("Failed to generate quiz. Please try again.");
      setFiles([]);
    },
    onFinish: ({ object }) => {
      console.log(object)
      if (object && object.length === 8) {
        setQuestions(object);
      } else {
        toast.error("Failed to generate all quiz questions");
        setFiles([]);
      }
    },
  });

  // Flashcard generation hook
  const {
    submit: submitFlashcards,
    object: partialFlashcards,
    isLoading: isLoadingFlashcards,
  } = experimental_useObject({
    api: "/api/generate-flashcards",
    schema: flashcardsSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate flashcards. Please try again.");
      setFiles([]);
    },
    onFinish: ({ object }) => {
      setFlashcards(object ?? []);
    },
  });

  // Match cards generation hook
  const {
    submit: submitMatchCards,
    object: partialMatchCards,
    isLoading: isLoadingMatchCards,
  } = experimental_useObject({
    api: "/api/generate-matchcards",
    schema: z.array(z.object({
      question: z.string(),
      answer: z.string(), 
      category: z.string(),
      type: z.string()
    })),
    initialValue: undefined,
    onError: (error) => {
      toast.error("Failed to generate match cards. Please try again.");
      setFiles([]);
    },
    onFinish: ({ object }) => {
      if (!object || object.length !== 6) {
        toast.error("Incorrect number of match cards", {
          description: `Expected 6 cards but got ${object?.length || 0}. Please try again.`,
        });
        return;
      }

      setMatchCards(object as MatchPair[]);
    },
  });

  // File handling functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      toast.error(
        "Safari does not support drag & drop. Please use the file picker.",
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024,
    );

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only PDF files under 5MB are allowed.");
    }

    setFiles(validFiles);
  };

  // Convert file to base64 string
  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Mode change handler
  const handleModeChange = async (newMode: StudyMode) => {
    setStudyMode(newMode);
  };

  // Form submission handler
  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await encodeFileAsBase64(file),
      })),
    );
    
    try {
      const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
      setTitle(generatedTitle);

      // Call all APIs simultaneously
      await Promise.all([
        submitQuiz({ files: encodedFiles }),
        submitFlashcards({ files: encodedFiles }),
        submitMatchCards({ files: encodedFiles })
      ]);

    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content. Please try again.");
    }
  };

  // Reset functions
  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
    setFlashcards([]);
    setMatchCards([]);
    setIsMatchingComplete(false);
  };

  const resetAll = () => {
    setFiles([]);
    setQuestions([]);
    setFlashcards([]);
    setMatchCards([]);
    setTitle(undefined);
    setStudyMode("quiz");
    setQuizAnswers([]);
    setIsMatchingComplete(false);
  };

  // Loading state based on selected mode
  const isLoading = isLoadingQuiz || isLoadingFlashcards || isLoadingMatchCards;

  // Calculate progress for selected mode
  const getModeProgress = () => {
    switch(studyMode) {
      case "quiz":
        return partialQuestions ? (partialQuestions.length / 8) * 100 : 0;
      case "flashcards":
        return partialFlashcards ? (partialFlashcards.length / 8) * 100 : 0;
      case "matching":
        return partialMatchCards ? (partialMatchCards.length / 6) * 100 : 0;
      default:
        return 0;
    }
  };
  
  const progress = getModeProgress();

  // Content state checks based on selected mode
  const hasContent = files.length > 0 && (
    (studyMode === "quiz" && questions.length === 8 && !isLoadingQuiz) ||
    (studyMode === "flashcards" && flashcards.length === 8 && !isLoadingFlashcards) ||
    (studyMode === "matching" && matchCards.length === 6 && !isLoadingMatchCards)
  );

  console.log("hasContent",flashcards);

  // Render content based on state
  if (hasContent) {
    return (
      <>
        <Header 
          mode={studyMode} 
          setMode={setStudyMode}
          questionCount={studyMode === "quiz" ? 8 : studyMode === "flashcards" ? 8 : 6}
          onReset={resetAll}
          answeredCount={studyMode === "quiz" ? quizAnswers.filter(answer => answer !== null).length : 0}
          onModeChange={handleModeChange}
          matchingComplete={isMatchingComplete}
        />
        {studyMode === "quiz" && questions.length === 8 && (
          <Quiz 
            title={title ?? "Quiz"} 
            questions={questions} 
            clearPDF={clearPDF}
            onAnswerSelect={(answers) => setQuizAnswers(answers)}
          />
        )}
        {studyMode === "flashcards" && flashcards.length === 8 && (
          <Flashcards title={title ?? "Flashcards"} flashcards={flashcards} clearPDF={clearPDF} />
        )}
        {studyMode === "matching" && matchCards.length === 6 && (
          <MatchCards 
            title={title ?? "Matching Game"} 
            matchCards={matchCards} 
            clearPDF={clearPDF}
            onGameComplete={() => setIsMatchingComplete(true)}
          />
        )}
      </>
    );
  }

  // Render file upload interface
  return (
    <div className="min-h-[100dvh] w-full flex justify-center items-center relative overflow-hidden">
      <AnimatedBackground />

      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>Drag and drop files here</div>
            <div className="text-sm dark:text-zinc-400 text-zinc-500">
              {"(PDFs only)"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Card className="w-full max-w-md border-0 sm:border backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80">
        <CardHeader className="text-center space-y-6">
          <motion.div 
            className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="rounded-full bg-primary/10 p-2">
              <FileUp className="h-6 w-6" />
            </div>
            <Plus className="h-4 w-4" />
            <div className="rounded-full bg-primary/10 p-2">
              <Brain className="h-6 w-6" />
            </div>
          </motion.div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              Smart Document Editor
            </CardTitle>
            <CardDescription className="text-base">
              Transform your PDFs into interactive learning materials
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitWithFiles} className="space-y-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors hover:border-muted-foreground/50 min-h-[200px] backdrop-blur-sm`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {files.length > 0 ? (
                  <span className="font-medium text-foreground">
                    {files[0].name}
                  </span>
                ) : (
                  <span>Drop your PDF here or click to browse.</span>
                )}
              </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={studyMode === "quiz" ? "default" : "outline"}
                className="w-full"
                onClick={() => setStudyMode("quiz")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Quiz
              </Button>
              <Button
                type="button"
                variant={studyMode === "flashcards" ? "default" : "outline"}
                className="w-full"
                onClick={() => setStudyMode("flashcards")}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Flashcards
              </Button>
              <Button
                type="button"
                variant={studyMode === "matching" ? "default" : "outline"}
                className="w-full"
                onClick={() => setStudyMode("matching")}
              >
                <Brain className="h-4 w-4 mr-2" />
                Matching
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={files.length === 0}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating {capitalizeFirst(studyMode)} materials...</span>
                </span>
              ) : (
                `Generate ${capitalizeFirst(studyMode)} materials`
              )}
            </Button>
          </form>
        </CardContent>
        {isLoading && (
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="w-full space-y-2">
              <div className="grid grid-cols-6 sm:grid-cols-4 items-center space-x-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-yellow-500/50 animate-pulse" />
                <span className="text-muted-foreground text-center col-span-4 sm:col-span-2">
                  {studyMode === "quiz" ? (
                    partialQuestions
                      ? `Generating question ${partialQuestions.length + 1} of 8`
                      : "Analyzing PDF content"
                  ) : studyMode === "flashcards" ? (
                    partialFlashcards
                      ? `Generating flashcard ${partialFlashcards.length + 1} of 8`
                      : "Analyzing PDF content"
                  ) : (
                    partialMatchCards
                      ? `Generating match set ${partialMatchCards.length + 1} of 6`
                      : "Analyzing PDF content"
                  )}
                </span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}