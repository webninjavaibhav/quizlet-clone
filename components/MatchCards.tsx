import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MatchPair } from "@/lib/matchCardSchema";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "@/components/ui/animated-background";

// Props interface for the MatchCards component
interface MatchCardsProps {
  title: string;
  matchCards: MatchPair[];
  clearPDF: () => void;
  onGameComplete?: () => void;
}

// Type definition for individual card data
type Card = {
  id: number;
  content: string;
  type: "question" | "answer";
  isMatched: boolean;
  originalIndex: number;
};

export default function MatchCards({ title, matchCards, clearPDF, onGameComplete }: MatchCardsProps) {
  // State management for game logic
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [gameComplete, setGameComplete] = useState(false);
  
  // Timer effect - starts on mount, stops when game is complete
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!gameComplete) {
      interval = setInterval(() => {
        setElapsedMs(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [gameComplete]);

  // Utility function to format milliseconds into readable time
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 100);

    return minutes > 0 
      ? `${minutes}m ${seconds.toString().padStart(2, '0')}.${milliseconds}s`
      : `${seconds}.${milliseconds}s`;
  };

  // Initialize and shuffle cards when matchCards prop changes
  useEffect(() => {
    const shuffledCards: Card[] = matchCards.flatMap((pair, index) => [
      {
        id: index * 2,
        content: pair.question,
        type: "question",
        isMatched: false,
        originalIndex: index,
      },
      {
        id: index * 2 + 1,
        content: pair.answer,
        type: "answer",
        isMatched: false,
        originalIndex: index,
      }
    ]);

    // Fisher-Yates shuffle
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }

    setCards(shuffledCards);
  }, [matchCards]);

  // Handle card selection and matching logic
  const handleCardClick = (card: Card) => {
    if (card.isMatched || selectedCards.length === 2) return;

    // Deselect if clicking same card
    if (selectedCards.length === 1 && selectedCards[0].id === card.id) {
      setSelectedCards([]);
      return;
    }

    const newSelectedCards = [...selectedCards, card];
    setSelectedCards(newSelectedCards);

    // Process pair when two cards are selected
    if (newSelectedCards.length === 2) {
      const [first, second] = newSelectedCards;
      
      // Validate card types match
      if (first.type === second.type) {
        toast.error("Invalid selection: Please choose a corresponding question-answer pair");
        setTimeout(() => setSelectedCards([first]), 1000);
        return;
      }

      // Check if pair matches
      if (first.originalIndex === second.originalIndex) {
        toast.success("Excellent! You've identified a correct match");
        setCards(cards.map(c => 
          c.id === first.id || c.id === second.id 
            ? { ...c, isMatched: true }
            : c
        ));
        const newMatchedPairs = matchedPairs + 1;
        setMatchedPairs(newMatchedPairs);
        
        // Check for game completion
        if (newMatchedPairs === matchCards.length) {
          setGameComplete(true);
          onGameComplete?.();
        }
        setSelectedCards([]);
      } else {
        toast.error("Incorrect match: Please review and try another combination");
        setTimeout(() => setSelectedCards([first]), 1000);
      }
    }
  };

  // Check if a card is currently selected
  const isSelected = (card: Card) => 
    selectedCards.some(selected => selected.id === card.id);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-8 relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">
            Match questions with their correct answers. 
            Matched pairs: {matchedPairs} / {matchCards.length}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map(card => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: card.isMatched ? 0 : 1,
                scale: card.isMatched ? 0.8 : 1
              }}
              whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
              onClick={() => !card.isMatched && handleCardClick(card)}
              className={cn(
                "cursor-pointer p-4 rounded-lg min-h-[120px] md:min-h-[150px] lg:min-h-[180px] flex items-center justify-center text-center",
                "border-2 transition-colors duration-200",
                card.type === "question" ? "bg-primary/10" : "bg-secondary/10",
                isSelected(card) && "border-primary",
                !isSelected(card) && "hover:border-primary/50",
                card.isMatched && "invisible"
              )}
            >
              {!card.isMatched && (
                <p className="text-xs md:text-sm lg:text-base">{card.content}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Victory modal */}
        {matchedPairs === matchCards.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="bg-background p-8 rounded-lg text-center backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80">
              <h2 className="text-2xl font-bold mb-4">🎉 Congratulations! 🎉</h2>
              <p className="mb-2">You&apos;ve matched all the pairs correctly!</p>
              <p className="text-lg font-mono mb-4">Time: {formatTime(elapsedMs)}</p>
              <Button onClick={clearPDF}>Try another PDF</Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}