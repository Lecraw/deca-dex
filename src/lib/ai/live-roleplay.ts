import Anthropic from "@anthropic-ai/sdk";

// Real DECA scoring structures by event category
export const SCORING_CONFIG = {
  PRINCIPLES_EVENTS: {
    piCount: 4,
    piMaxPoints: 20,
    overallImpressionMax: 20,
    twentyFirstCenturySkills: [
      "Reason effectively and use systems thinking",
      "Make judgments and decisions, and solve problems",
      "Communicate clearly",
      "Show evidence of creativity",
    ],
  },
  INDIVIDUAL_SERIES: {
    piCount: 5,
    piMaxPoints: 14,
    twentyFirstCenturySkills: [
      "Reason effectively and use systems thinking",
      "Make judgments and decisions, and solve problems",
      "Communicate clearly",
      "Show evidence of creativity",
    ],
    twentyFirstCenturyMaxPoints: 6,
    overallImpressionMax: 6,
  },
  TEAM_DECISION_MAKING: {
    piCount: 7,
    piMaxPoints: 10,
    twentyFirstCenturySkills: [
      "Clarity of expression",
      "Organization of ideas",
      "Evidence of mature judgment",
      "Effective participation of both team members",
    ],
    twentyFirstCenturyMaxPoints: 6,
    overallImpressionMax: 6,
  },
};

export type ScoringCategory = keyof typeof SCORING_CONFIG;

export function getScoringConfig(category: string) {
  if (category in SCORING_CONFIG) {
    return SCORING_CONFIG[category as ScoringCategory];
  }
  return SCORING_CONFIG.PRINCIPLES_EVENTS;
}

export type ScenarioData = {
  scenario: string;
  performanceIndicators: string[];
  judgeFollowUpQuestions: string[];
  twentyFirstCenturySkills: string[];
  eventName: string;
  eventCategory: string;
};

export type RoleplayGrade = {
  totalScore: number;
  overallFeedback?: string;
  piScores?: Array<{
    indicator: string;
    score: number;
    maxPoints: number;
    feedback: string;
    level?: string;
  }>;
  twentyFirstCenturyScores?: Array<{
    skill: string;
    score: number;
    maxPoints: number;
  }>;
  strengths?: string[];
  improvements?: string[];
};

function tryParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

type StreamControl = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
};

/**
 * Generate a roleplay scenario + PIs + judge follow-up questions for a DECA event.
 * Streams keep-alive spaces to the controller and returns the parsed scenario (or null on failure).
 */
export async function generateScenario(
  event: { code: string; name: string; category: string; cluster: string },
  stream: StreamControl
): Promise<ScenarioData | null> {
  const config = getScoringConfig(event.category);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let fullText = "";

  const messageStream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: `You are a DECA competition scenario generator for the ${event.name} (${event.code}) event.

This is a ${event.category.replace(/_/g, " ")} event in the ${event.cluster.replace(/_/g, " ")} career cluster.

Generate a realistic DECA roleplay scenario. Return ONLY a JSON object (no markdown, no code blocks) with this structure:

{"scenario":"Full scenario text in 2nd person...","performanceIndicators":["PI 1","PI 2"${config.piCount > 2 ? ',...' : ''}],"judgeFollowUpQuestions":["Q1?","Q2?"]}

Requirements:
- Scenario: 2-3 paragraphs, 2nd person ("You are to assume the role of..."), realistic business context, end with roleplay setup
- Exactly ${config.piCount} performance indicators as action statements from the ${event.cluster.replace(/_/g, " ")} cluster
- Exactly 2 follow-up questions`,
    messages: [
      {
        role: "user",
        content: `Generate a roleplay scenario with ${config.piCount} performance indicators for ${event.name} (${event.code}).`,
      },
    ],
  });

  messageStream.on("text", (text) => {
    fullText += text;
    stream.controller.enqueue(stream.encoder.encode(" "));
  });

  await messageStream.finalMessage();

  const parsed = tryParseJson<{
    scenario?: string;
    performanceIndicators?: string[];
    judgeFollowUpQuestions?: string[];
  }>(fullText);

  if (!parsed?.scenario || !parsed?.performanceIndicators) return null;

  return {
    scenario: parsed.scenario,
    performanceIndicators: parsed.performanceIndicators,
    judgeFollowUpQuestions: (parsed.judgeFollowUpQuestions ?? []).slice(0, 2),
    twentyFirstCenturySkills: config.twentyFirstCenturySkills,
    eventName: event.name,
    eventCategory: event.category,
  };
}

function buildScoringInstructions(eventCategory: string): string {
  if (eventCategory === "PRINCIPLES_EVENTS") {
    return `
Score each PI on 0-20 (Exceeds 16-20, Meets 11-15, Below 6-10, Little/No 0-5).
Score "Overall Impression" on 0-20. Total out of 100.

Return JSON:
{"totalScore":<0-100>,"overallFeedback":"2-3 sentences","piScores":[{"indicator":"text","score":<0-20>,"maxPoints":20,"feedback":"text","level":"Exceeds/Meets/Below/Little-No Value"}],"twentyFirstCenturyScores":[{"skill":"Overall Impression & Responses to Questions","score":<0-20>,"maxPoints":20}],"strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"]}`;
  }
  if (eventCategory === "INDIVIDUAL_SERIES") {
    return `
Score each PI on 0-14 (Exceeds 12-14, Meets 9-11, Below 5-8, Little/No 0-4).
Score 21st Century Skills on 0-6 each. Overall Impression on 0-6. Total out of 100.

Return JSON:
{"totalScore":<0-100>,"overallFeedback":"2-3 sentences","piScores":[{"indicator":"text","score":<0-14>,"maxPoints":14,"feedback":"text","level":"Exceeds/Meets/Below/Little-No Value"}],"twentyFirstCenturyScores":[{"skill":"Reason effectively","score":<0-6>,"maxPoints":6},{"skill":"Make judgments","score":<0-6>,"maxPoints":6},{"skill":"Communicate clearly","score":<0-6>,"maxPoints":6},{"skill":"Show creativity","score":<0-6>,"maxPoints":6},{"skill":"Overall Impression","score":<0-6>,"maxPoints":6}],"strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"]}`;
  }
  return `
Score each PI on 0-10 (Exceeds 9-10, Meets 7-8, Below 4-6, Little/No 0-3).
Score supplemental categories on 0-6 each. Total out of 100.

Return JSON:
{"totalScore":<0-100>,"overallFeedback":"2-3 sentences","piScores":[{"indicator":"text","score":<0-10>,"maxPoints":10,"feedback":"text","level":"Exceeds/Meets/Below/Little-No Value"}],"twentyFirstCenturyScores":[{"skill":"Clarity of expression","score":<0-6>,"maxPoints":6},{"skill":"Organization of ideas","score":<0-6>,"maxPoints":6},{"skill":"Evidence of mature judgment","score":<0-6>,"maxPoints":6},{"skill":"Effective participation","score":<0-6>,"maxPoints":6},{"skill":"Overall Impression","score":<0-6>,"maxPoints":6}],"strengths":["s1","s2","s3"],"improvements":["i1","i2","i3"]}`;
}

/**
 * Grade a full roleplay transcript. Streams keep-alive spaces and returns parsed grade (or null).
 */
export async function gradeRoleplay(
  params: {
    eventCode: string;
    eventName: string;
    eventCategory: string;
    scenario: string;
    performanceIndicators: string[];
    fullTranscript: string;
  },
  stream: StreamControl
): Promise<RoleplayGrade | null> {
  const scoringInstructions = buildScoringInstructions(params.eventCategory);
  const piList = params.performanceIndicators
    .map((p, i) => `PI ${i + 1}: ${p}`)
    .join("; ");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let fullText = "";

  const messageStream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2500,
    system: `You are a DECA judge evaluating a student's roleplay for ${params.eventName} (${params.eventCode}), a ${params.eventCategory.replace(/_/g, " ")} event.

Scenario: ${params.scenario.substring(0, 500)}...

PIs to address: ${piList}

The transcript is from speech-to-text — focus on substance, not transcription errors. Be STRICT and realistic like an actual DECA judge.

CRITICAL SCORING RULES:
- A response of just a few words or sentences should score VERY LOW (0-20 total). Do NOT give high scores for minimal effort.
- If the student barely addresses any PIs, score each PI in the "Little/No Value" range.
- A perfect score requires thorough, professional, well-structured responses addressing ALL performance indicators.
- Score proportionally to the depth and quality of the response. Short or vague answers = low scores.
- Be constructive in feedback but DO NOT inflate scores.

Return ONLY a JSON object (no markdown, no code blocks).

${scoringInstructions}`,
    messages: [
      {
        role: "user",
        content: `Student's roleplay transcript:\n\n${params.fullTranscript}`,
      },
    ],
  });

  messageStream.on("text", (text) => {
    fullText += text;
    stream.controller.enqueue(stream.encoder.encode(" "));
  });

  await messageStream.finalMessage();
  return tryParseJson<RoleplayGrade>(fullText);
}

export type QuizQuestion = {
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export type SanitizedQuizQuestion = {
  prompt: string;
  options: [string, string, string, string];
};

export function sanitizeQuiz(questions: QuizQuestion[]): SanitizedQuizQuestion[] {
  return questions.map((q) => ({ prompt: q.prompt, options: q.options }));
}

/**
 * Generate 10 multiple-choice knowledge questions for a DECA event's cluster.
 * Returns null on parse failure.
 */
export async function generateQuiz(event: {
  code: string;
  name: string;
  cluster: string;
  description: string;
}): Promise<QuizQuestion[] | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2500,
    system: `You are a DECA cluster exam writer for the ${event.cluster.replace(/_/g, " ")} career cluster.

Event context: ${event.name} (${event.code}). ${event.description.substring(0, 400)}

Generate exactly 10 multiple-choice questions in the style of real DECA cluster exam questions. Cover core concepts, applied business knowledge, terminology, and scenario reasoning relevant to ${event.name}.

Rules:
- Each question has exactly 4 options, one clearly correct.
- Distractors must be plausible.
- Vary difficulty across the 10 questions.
- Do not reference DECA, the student, or "the exam" in question text.

Return ONLY a JSON object (no markdown, no code blocks):
{"questions":[{"prompt":"...","options":["A","B","C","D"],"correctIndex":0}]}

correctIndex is 0-3 (zero-based).`,
    messages: [
      {
        role: "user",
        content: `Generate 10 multiple-choice questions for the ${event.cluster.replace(/_/g, " ")} cluster, calibrated to ${event.name} (${event.code}).`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const parsed = tryParseJson<{ questions?: QuizQuestion[] }>(textBlock.text);
  if (!parsed?.questions || !Array.isArray(parsed.questions)) return null;

  const valid = parsed.questions.filter(
    (q): q is QuizQuestion =>
      typeof q?.prompt === "string" &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((o) => typeof o === "string") &&
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3
  );

  if (valid.length < 10) return null;
  return valid.slice(0, 10);
}

export function gradeQuiz(
  questions: QuizQuestion[],
  userAnswers: number[]
): { quizScore: number; correctAnswers: number[] } {
  const correctAnswers = questions.map((q) => q.correctIndex);
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (userAnswers[i] === questions[i].correctIndex) correct += 1;
  }
  const quizScore = questions.length === 0 ? 0 : (correct / questions.length) * 100;
  return { quizScore, correctAnswers };
}
