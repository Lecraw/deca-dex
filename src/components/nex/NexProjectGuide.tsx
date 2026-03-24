"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NexAvatar } from "./NexAvatar";
import { FloatingCard } from "@/components/ui/floating-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Lightbulb,
  Target,
  FileText,
  CheckCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ProjectStage {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  tips: string[];
  encouragement: string;
  mood: "happy" | "thinking" | "excited" | "helpful";
}

const PROJECT_STAGES: ProjectStage[] = [
  {
    id: "ideation",
    title: "Idea Generation",
    icon: Lightbulb,
    description: "Let's brainstorm a winning business idea!",
    tips: [
      "Think about problems you've personally experienced",
      "Consider current trends and market gaps",
      "Don't worry about perfection - we'll refine it together!"
    ],
    encouragement: "Every great business starts with a simple idea. You've got this!",
    mood: "excited"
  },
  {
    id: "research",
    title: "Research & Analysis",
    icon: Target,
    description: "Time to validate your idea with solid research.",
    tips: [
      "Use the research templates I've prepared for you",
      "Focus on your target market and competition",
      "Data-driven insights will impress the judges!"
    ],
    encouragement: "Research might seem tedious, but it's what separates winners from participants!",
    mood: "thinking"
  },
  {
    id: "development",
    title: "Project Development",
    icon: FileText,
    description: "Let's build your pitch deck or written report!",
    tips: [
      "Follow the DECA guidelines closely",
      "Use visuals to make your points memorable",
      "Tell a compelling story with your data"
    ],
    encouragement: "You're creating something amazing! Keep pushing forward! 🚀",
    mood: "helpful"
  },
  {
    id: "review",
    title: "Review & Polish",
    icon: CheckCircle,
    description: "Almost there! Let's make it perfect.",
    tips: [
      "Run the compliance checker to catch any issues",
      "Get AI feedback on your presentation",
      "Practice with the judge simulator"
    ],
    encouragement: "The finish line is in sight! Let's make this project shine! ✨",
    mood: "happy"
  }
];

interface NexProjectGuideProps {
  currentStage?: string;
  projectType?: "PITCH_DECK" | "WRITTEN_REPORT";
  onStageAction?: (stageId: string) => void;
  className?: string;
}

export function NexProjectGuide({
  currentStage = "ideation",
  projectType,
  onStageAction,
  className
}: NexProjectGuideProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(currentStage);
  const [showHelp, setShowHelp] = useState(false);

  const currentStageIndex = PROJECT_STAGES.findIndex(s => s.id === currentStage);
  const progress = ((currentStageIndex + 1) / PROJECT_STAGES.length) * 100;
  const stage = PROJECT_STAGES.find(s => s.id === currentStage) || PROJECT_STAGES[0];

  useEffect(() => {
    setExpandedStage(currentStage);
  }, [currentStage]);

  return (
    <FloatingCard className={cn("p-6 space-y-4", className)}>
      {/* Header with Nex */}
      <div className="flex items-start gap-4">
        <NexAvatar size="md" mood={stage.mood} />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Nex's Project Guide</h3>
          <p className="text-xs text-muted-foreground">
            I'm here to help you create an amazing {projectType === "PITCH_DECK" ? "pitch deck" : "written report"}!
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setShowHelp(!showHelp)}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Stage Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 rounded-xl p-4 border border-primary/10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <stage.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{stage.title}</h4>
            <p className="text-xs text-muted-foreground">{stage.description}</p>
          </div>
        </div>

        <AnimatePresence>
          {expandedStage === stage.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-3"
            >
              {/* Tips */}
              <div className="space-y-1">
                {stage.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <Sparkles className="h-3 w-3 text-primary mt-0.5" />
                    <span className="text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </div>

              {/* Encouragement */}
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs font-medium italic">{stage.encouragement}</p>
              </div>

              {/* Action Button */}
              {onStageAction && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onStageAction(stage.id)}
                >
                  Continue with {stage.title}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
          className="w-full mt-2 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
        >
          {expandedStage === stage.id ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show tips
            </>
          )}
        </button>
      </motion.div>

      {/* Stage Timeline */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-muted-foreground">Your Journey</h5>
        <div className="space-y-1">
          {PROJECT_STAGES.map((s, index) => {
            const isComplete = index < currentStageIndex;
            const isCurrent = s.id === currentStage;
            const isUpcoming = index > currentStageIndex;

            return (
              <button
                key={s.id}
                onClick={() => setExpandedStage(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                  isCurrent && "bg-primary/10",
                  isComplete && "hover:bg-accent/50",
                  isUpcoming && "opacity-50"
                )}
                disabled={isUpcoming}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  isComplete && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground",
                  isUpcoming && "bg-muted text-muted-foreground"
                )}>
                  {isComplete ? "✓" : index + 1}
                </div>
                <div className="flex-1">
                  <span className={cn(
                    "text-xs font-medium",
                    !isUpcoming && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}>
                    {s.title}
                  </span>
                </div>
                {isCurrent && (
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Help Section */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t pt-4"
          >
            <p className="text-xs text-muted-foreground">
              <strong>Need help?</strong> I'm always here to guide you! Click on any stage to see tips,
              or use the AI tools in each section for personalized assistance. Remember, every DECA
              champion started exactly where you are now!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </FloatingCard>
  );
}

const cn = (...classes: (string | undefined | boolean)[]) =>
  classes.filter(Boolean).join(" ");