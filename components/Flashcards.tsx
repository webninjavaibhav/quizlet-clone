"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import type { Flashcard } from "@/lib/flashcardSchema";

interface FlashcardsProps {
  title: string;
  flashcards: Flashcard[];
  clearPDF: () => void;
}

export default function Flashcards({ title, flashcards, clearPDF }: FlashcardsProps) {
  // State management for current card index and flip status
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Get current flashcard based on index
  const currentCard = flashcards[currentIndex];

  // Navigate to next card if available
  const goToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false); // Reset flip state
    }
  };

  // Navigate to previous card if available 
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false); // Reset flip state
    }
  };

  // Toggle card flip state
  const handleFlip = () => setIsFlipped(!isFlipped);

  // Render card content based on type (QA or fill-in-blank)
  const renderCardContent = () => {
    // Handle QA type cards
    if (currentCard.type === "qa") {
      return (
        <div className="text-lg">
          {isFlipped ? currentCard.answer : currentCard.question}
        </div>
      );
    }

    // Handle fill-in-blank type cards
    if (isFlipped) {
      return (
        <div className="space-y-4">
          <div className="text-lg mb-4">Answers:</div>
          <div className="grid grid-cols-1 gap-3">
            {currentCard.answers.map((answer, index) => (
              <div 
                key={index}
                className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium"
              >
                {index + 1}. {answer}
              </div>
            ))}
          </div>
          {currentCard.hints && (
            <div className="text-sm text-muted-foreground mt-4">
              <strong>Hints:</strong>
              <ul className="list-disc list-inside">
                {currentCard.hints.map((hint, index) => (
                  <li key={index}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Render fill-in-blank question
    return (
      <div className="space-y-4">
        <div className="text-lg whitespace-pre-wrap">
          {currentCard.text.split("____").map((part, index, array) => (
            <span key={index}>
              {part}
              {index < array.length - 1 && (
                <span className="inline-block w-16 h-0.5 bg-primary/50 mx-1 align-middle" />
              )}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={goToNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Flashcard container with 3D flip animation */}
      <div className="flex justify-center">
        <motion.div
          className="w-full max-w-2xl aspect-[3/2] perspective-1000"
          onClick={handleFlip}
        >
          <motion.div
            className="w-full h-full relative transform-style-3d cursor-pointer"
            animate={{ rotateY: isFlipped ? -180 : 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Front of card */}
            <motion.div
              className={`absolute w-full h-full backface-hidden rounded-xl border p-8 flex flex-col items-center justify-center text-center bg-card ${
                isFlipped ? "hidden" : ""
              }`}
            >
              <div className="text-sm text-muted-foreground mb-4">
                {currentCard.category}
              </div>
              {renderCardContent()}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RotateCw className="h-4 w-4 animate-[spin_3s_linear_infinite]" />
                <span>Click card to see {currentCard.type === "qa" ? "answer" : "answers"}</span>
              </div>
            </motion.div>

            {/* Back of card */}
            <motion.div
             animate={{ rotateY: isFlipped ? -180 : 0 }}
             transition={{ duration: 0}}
              className={`absolute w-full h-full backface-hidden rounded-xl border p-8 flex flex-col items-center justify-center text-center rotate-y-180 bg-card ${
                !isFlipped ? "hidden" : ""
              }`}
            >
              <div className="text-sm text-muted-foreground mb-4">
                {currentCard.category}
              </div>
              {renderCardContent()}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RotateCw className="h-4 w-4 animate-[spin_3s_linear_infinite]" />
                <span>Click to flip back</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Reset button */}
      <div className="flex justify-center mt-8">
        <Button variant="outline" onClick={clearPDF}>
          Try another PDF
        </Button>
      </div>
    </div>
  );
}