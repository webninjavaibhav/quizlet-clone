import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import QuizScore from "./score";
import QuizReview from "./quiz-overview";
import { Question } from "@/lib/schemas";

// Props type definition for Quiz component
type QuizProps = {
  questions: Question[];
  clearPDF: () => void;
  title: string;
  onAnswerSelect: (answers: string[]) => void;
};

// Props type definition for QuestionCard component
type QuestionCardProps = {
  question: Question;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  isSubmitted: boolean;
  showCorrectAnswer: boolean;
};

// QuestionCard component for rendering individual quiz questions
const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  selectedAnswer, 
  onSelectAnswer, 
  showCorrectAnswer 
}) => {
  const answerLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold leading-tight">
        {question.question}
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant={selectedAnswer === answerLabels[index] ? "secondary" : "outline"}
            className={`h-auto py-6 px-4 justify-start text-left whitespace-normal ${
              showCorrectAnswer && answerLabels[index] === question.answer
                ? "bg-green-600 hover:bg-green-700"
                : showCorrectAnswer &&
                  selectedAnswer === answerLabels[index] &&
                  selectedAnswer !== question.answer
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
            }`}
            onClick={() => onSelectAnswer(answerLabels[index])}
          >
            <span className="text-lg font-medium mr-4 shrink-0">
              {answerLabels[index]}
            </span>
            <span className="flex-grow">{option}</span>
            {(showCorrectAnswer && answerLabels[index] === question.answer) ||
              (selectedAnswer === answerLabels[index] && (
                <Check className="ml-2 shrink-0 text-white" size={20} />
              ))}
            {showCorrectAnswer &&
              selectedAnswer === answerLabels[index] &&
              selectedAnswer !== question.answer && (
                <X className="ml-2 shrink-0 text-white" size={20} />
              )}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Main Quiz component
export default function Quiz({
  questions,
  clearPDF,
  title = "Quiz",
  onAnswerSelect,
}: QuizProps) {
  // State management
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(null));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Refs for question elements to enable smooth scrolling
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headerHeight = 100;

  // Update progress bar when current question changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((currentQuestionIndex / questions.length) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, questions.length]);

  // Handle answer selection and auto-scroll
  const handleSelectAnswer = (answer: string, index: number) => {
    if (isSubmitted) return;

    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);
    onAnswerSelect(newAnswers);

    // Auto-scroll to next question
    if (index < questions.length - 1) {
      const nextQuestion = questionRefs.current[index + 1];
      if (nextQuestion) {
        const elementPosition = nextQuestion.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  // Handle quiz submission
  const handleSubmit = () => {
    setIsSubmitted(true);
    const correctAnswers = questions.reduce((acc, question, index) => (
      acc + (question.answer === answers[index] ? 1 : 0)
    ), 0);
    setScore(correctAnswers);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset quiz state
  const handleReset = () => {
    const emptyAnswers = Array(questions.length).fill(null);
    setAnswers(emptyAnswers);
    onAnswerSelect(emptyAnswers);
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);
    setProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allQuestionsAnswered = answers.every(answer => answer !== null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
          {title}
        </h1>
        <div className="relative">
          {!isSubmitted && <Progress value={progress} className="h-1 mb-8" />}
          <div className="space-y-12">
            {!isSubmitted ? (
              <>
                {questions.map((question, index) => (
                  <div 
                    key={index}
                    ref={(el) => { questionRefs.current[index] = el }}
                    className="space-y-8"
                  >
                    <QuestionCard
                      question={question}
                      selectedAnswer={answers[index]}
                      onSelectAnswer={(answer) => handleSelectAnswer(answer, index)}
                      isSubmitted={isSubmitted}
                      showCorrectAnswer={false}
                    />
                  </div>
                ))}
                {allQuestionsAnswered && (
                  <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t shadow-lg">
                    <div className="container mx-auto max-w-4xl">
                      <Button onClick={handleSubmit} className="w-full">
                        Submit Quiz
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-8">
                <QuizScore
                  correctAnswers={score ?? 0}
                  totalQuestions={questions.length}
                />
                <div className="space-y-12">
                  <QuizReview questions={questions} userAnswers={answers} />
                </div>
                <div className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t shadow-lg">
                  <div className="container mx-auto max-w-4xl flex justify-center space-x-4">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="bg-muted hover:bg-muted/80 w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Reset Quiz
                    </Button>
                    <Button
                      onClick={clearPDF}
                      className="bg-primary hover:bg-primary/90 w-full"
                    >
                      <FileText className="mr-2 h-4 w-4" /> Try Another PDF
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
