import { BookOpen, ListChecks, Brain, ChevronDown, Home, Timer } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useState, useEffect } from "react";

// Available study modes
type StudyMode = "quiz" | "flashcards" | "matching";

// Props interface for Header component
interface HeaderProps {
  mode: StudyMode;
  setMode: (mode: StudyMode) => void; 
  questionCount: number;
  onReset: () => void;
  answeredCount?: number;
  onModeChange?: (mode: StudyMode) => void;
  matchingComplete?: boolean;
}

export function Header({ 
  mode, 
  questionCount, 
  onReset,
  answeredCount = 0,
  onModeChange,
  matchingComplete = false
}: HeaderProps) {
  // Track elapsed time for matching mode
  const [elapsedMs, setElapsedMs] = useState(0);

  // Timer effect for matching mode
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (mode === "matching" && !matchingComplete) {
      interval = setInterval(() => {
        setElapsedMs(prev => prev + 10);
      }, 10);
    } else {
      setElapsedMs(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, matchingComplete]);

  // Format milliseconds into readable time string
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 100);

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}.${milliseconds}`;
    } else if (seconds > 0) {
      return `${seconds}.${milliseconds}`;
    }
    return `${milliseconds}`;
  };

  // Handle study mode changes
  const handleModeChange = (newMode: StudyMode) => {
    setElapsedMs(0);
    onModeChange?.(newMode);
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 rounded-lg border-b">
      {/* Mode selector dropdown */}
      <div className="flex-1 flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 px-6 text-base">
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem 
              onClick={() => handleModeChange("quiz")} 
              className={`py-2 ${mode === "quiz" ? "bg-accent" : ""}`}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Quiz
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleModeChange("flashcards")} 
              className={`py-2 ${mode === "flashcards" ? "bg-accent" : ""}`}
            >
              <ListChecks className="mr-2 h-5 w-5" />
              Flashcards
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleModeChange("matching")} 
              className={`py-2 ${mode === "matching" ? "bg-accent" : ""}`}
            >
              <Brain className="mr-2 h-5 w-5" />
              Matching
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mode-specific status display */}
      <div className="text-base md:text-lg font-semibold flex-1 text-center flex items-center justify-center gap-4 text-primary/90">
        {mode === "quiz" && (
          <span className="bg-primary/5 px-4 py-2 rounded-lg">
            Questions Answered: {answeredCount}/{questionCount}
          </span>
        )}
        {mode === "flashcards" && (
          <span className="bg-primary/5 px-4 py-2 rounded-lg">
            Flashcards Quiz
          </span>
        )}
        {mode === "matching" && (
          <div className="bg-primary/5 px-4 py-2 rounded-lg flex items-center gap-3">
            <span>Match Quiz</span>
            <div className="flex items-center border-l pl-3 border-primary/20">
              <Timer className="h-4 w-4 mr-1" />
              <span className="font-mono">{formatTime(elapsedMs)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Reset button */}
      <div className="flex-1 flex justify-end">
        <Button variant="ghost" onClick={onReset}>
          <Home className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}