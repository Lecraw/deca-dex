export interface DecaEventData {
  code: string;
  name: string;
  cluster: string;
  category: string;
  eventType: "PITCH_DECK" | "WRITTEN_REPORT" | "ROLEPLAY" | "ONLINE_SIMULATION";
  maxSlides?: number;
  maxPages?: number;
  presentationMin?: number;
  prepMin?: number;
  hasExam: boolean;
  teamMin: number;
  teamMax: number;
  description: string;
  rubric: RubricCategory[];
  guidelines: EventGuidelines;
  sections: EventSection[];
}

export interface RubricCategory {
  name: string;
  maxPoints: number;
  description: string;
  indicators: string[];
}

export interface EventGuidelines {
  formatting: string[];
  requirements: string[];
  tips: string[];
}

export interface EventSection {
  key: string;
  title: string;
  description: string;
  required: boolean;
  suggestedSlides?: number;
  suggestedPages?: number;
}

export interface GeneratedIdea {
  name: string;
  pitch: string;
  problem: string;
  targetMarket: string;
  revenueModel: string;
  uniqueness: string;
}

export interface ComplianceResult {
  allCompliant: boolean;
  checks: ComplianceCheck[];
  summary: string;
  overrides?: string[];
}

export interface ComplianceCheck {
  name: string;
  passed: boolean;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface JudgeResult {
  totalScore: number;
  maxScore: number;
  categories: {
    name: string;
    score: number;
    maxPoints: number;
    feedback: string;
  }[];
  strengths: string[];
  improvements: string[];
  overallNotes: string;
}
