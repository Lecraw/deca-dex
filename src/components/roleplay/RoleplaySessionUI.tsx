"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Loader2,
  Trophy,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Clock,
  Send,
  CheckCircle2,
} from "lucide-react";

export interface RoleplayMessage {
  role: "user" | "judge";
  content: string;
  timestamp: string;
}

export interface QuizQuestionView {
  prompt: string;
  options: [string, string, string, string];
}

export interface RoleplaySessionData {
  id: string;
  eventCode: string;
  eventName: string;
  eventCategory: string;
  scenario: string;
  performanceIndicators: string[];
  twentyFirstCenturySkills: string[];
  judgeFollowUpQuestions: string[];
  messages: RoleplayMessage[];
  completed: boolean;
  score: RoleplayScore | null;
  roleplayStartedAt?: string | null;
  quizQuestions?: QuizQuestionView[] | null;
  quizSubmitted?: boolean;
}

export interface RoleplayScore {
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
  quizQuestions?: QuizQuestionView[];
}

export interface QuizResult {
  roleplayScore: number;
  quizScore: number;
  totalScore: number;
  correctAnswers: number[];
  userAnswers: number[];
}

interface Props {
  sessionData: RoleplaySessionData | undefined;
  isLoading: boolean;
  onEndSession: (fullTranscript: string) => Promise<RoleplayScore>;
  onSubmitQuiz?: (answers: number[]) => Promise<QuizResult>;
  backHref: string;
  newHref: string;
  newLabel?: string;
  headerSubtitle?: string;
}

type Phase = "prep" | "presenting" | "followup" | "quiz" | "results";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionResultLikeEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionResultLikeEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function RoleplaySessionUI({
  sessionData,
  isLoading,
  onEndSession,
  onSubmitQuiz,
  backHref,
  newHref,
  newLabel = "New Roleplay",
  headerSubtitle,
}: Props) {
  const [phase, setPhase] = useState<Phase>("prep");
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [prepTimeLeft, setPrepTimeLeft] = useState(600);
  const [presentTimeLeft, setPresentTimeLeft] = useState(600);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionView[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizSubmitError, setQuizSubmitError] = useState<string | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const presentTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!getSpeechRecognition()) setSpeechSupported(false);
  }, []);

  // Host clicked "Start Roleplay for Everyone" — auto-jump from prep to
  // presenting so all participants begin at once.
  useEffect(() => {
    if (sessionData?.roleplayStartedAt && phase === "prep") {
      setPhase("presenting");
    }
  }, [sessionData?.roleplayStartedAt, phase]);

  // Rehydrate the quiz if the participant refreshes after the roleplay was
  // graded but before they submitted answers.
  useEffect(() => {
    if (
      sessionData?.quizQuestions &&
      sessionData.quizQuestions.length > 0 &&
      !sessionData.quizSubmitted &&
      phase !== "quiz" &&
      phase !== "results"
    ) {
      setQuizQuestions(sessionData.quizQuestions);
      setQuizAnswers(new Array(sessionData.quizQuestions.length).fill(null));
      setPhase("quiz");
    }
  }, [sessionData?.quizQuestions, sessionData?.quizSubmitted, phase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript]);

  useEffect(() => {
    if (phase === "prep") {
      prepTimerRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            if (prepTimerRef.current) clearInterval(prepTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "presenting" || phase === "followup") {
      presentTimerRef.current = setInterval(() => {
        setPresentTimeLeft((prev) => {
          if (prev <= 1) {
            if (presentTimerRef.current) clearInterval(presentTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (presentTimerRef.current) clearInterval(presentTimerRef.current);
    };
  }, [phase]);

  const startListening = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError("Speech recognition is not supported in this browser.");
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setSpeechSupported(false);
      setSpeechError("Speech recognition requires HTTPS. Please use localhost or a secure connection.");
      return;
    }

    setSpeechError(null);

    // Explicitly request microphone access so the browser shows a permission
    // prompt before speech recognition starts. Without this, some browsers
    // start recognition silently and never surface the prompt.
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setSpeechSupported(false);
          setSpeechError("Microphone access was denied. Please allow microphone access in your browser settings and try again.");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setSpeechError("No microphone found. Please connect a microphone and try again.");
        } else {
          setSpeechError("Could not access the microphone. You can still type your response below.");
        }
        return;
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) setTranscript((prev) => prev + " " + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        recognitionRef.current = null;
        setIsListening(false);
        setSpeechSupported(false);
        setSpeechError("Microphone access was denied. Please allow microphone access in your browser settings and try again.");
      } else if (event.error === "no-speech") {
        setSpeechError("No speech detected. Make sure your microphone is working and try speaking louder.");
      } else if (event.error === "audio-capture") {
        recognitionRef.current = null;
        setIsListening(false);
        setSpeechError("No microphone found. Please connect a microphone and try again.");
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to start speech recognition:", err);
      recognitionRef.current = null;
      setIsListening(false);
      setSpeechError("Failed to start speech recognition: " + msg);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const endSession = useMutation({
    mutationFn: (fullTranscript: string) => onEndSession(fullTranscript),
    onSuccess: (score) => {
      if (onSubmitQuiz && score.quizQuestions && score.quizQuestions.length > 0) {
        setQuizQuestions(score.quizQuestions);
        setQuizAnswers(new Array(score.quizQuestions.length).fill(null));
        setPhase("quiz");
      } else {
        setPhase("results");
      }
    },
  });

  const submitQuizAnswers = async () => {
    if (!onSubmitQuiz) return;
    const answers = quizAnswers.filter((a): a is number => a !== null);
    if (answers.length !== quizQuestions.length) return;
    setQuizSubmitting(true);
    setQuizSubmitError(null);
    try {
      const result = await onSubmitQuiz(answers);
      setQuizResult(result);
      setPhase("results");
    } catch (err) {
      setQuizSubmitError(err instanceof Error ? err.message : "Failed to submit quiz.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleStartPresenting = () => {
    setPhase("presenting");
    startListening();
  };

  const handleSubmitSpeech = () => {
    const text = transcript.trim();
    if (!text) return;

    stopListening();

    const userMsg: RoleplayMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTranscript("");
    setInterimTranscript("");

    if (phase === "presenting") {
      setPhase("followup");
      if (sessionData?.judgeFollowUpQuestions && sessionData.judgeFollowUpQuestions.length > 0) {
        setTimeout(() => {
          const judgeMsg: RoleplayMessage = {
            role: "judge",
            content: sessionData.judgeFollowUpQuestions[0],
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, judgeMsg]);
          setFollowUpIndex(1);
        }, 1000);
      }
    } else if (phase === "followup") {
      if (sessionData?.judgeFollowUpQuestions && followUpIndex < sessionData.judgeFollowUpQuestions.length) {
        setTimeout(() => {
          const judgeMsg: RoleplayMessage = {
            role: "judge",
            content: sessionData.judgeFollowUpQuestions[followUpIndex],
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, judgeMsg]);
          setFollowUpIndex(followUpIndex + 1);
        }, 1000);
      } else {
        setTimeout(() => {
          const judgeMsg: RoleplayMessage = {
            role: "judge",
            content: "Thank you for your presentation. I appreciate your thoroughness. That concludes our roleplay.",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, judgeMsg]);
        }, 1000);
      }
    }
  };

  const handleFinishRoleplay = () => {
    stopListening();
    const pendingText = transcript.trim();

    const allMsgs = [...messages];
    if (pendingText) {
      allMsgs.push({ role: "user", content: pendingText, timestamp: new Date().toISOString() });
    }

    if (allMsgs.length === 0) return;

    setMessages(allMsgs);
    setTranscript("");
    setInterimTranscript("");

    const fullTranscript = allMsgs.map((m) => `${m.role}: ${m.content}`).join("\n\n");
    endSession.mutate(fullTranscript);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session not found</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href={backHref}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
      </div>
    );
  }

  if (sessionData.completed && sessionData.score && phase !== "results") {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
        <div className="space-y-1">
          <p className="text-base font-semibold">You&apos;ve already finished this roleplay</p>
          <p className="text-sm text-muted-foreground">Each roleplay can only be submitted once.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href={backHref}><ArrowLeft className="h-4 w-4 mr-1.5" /> Back</Link>
          </Button>
          <Button asChild>
            <Link href={newHref}><Sparkles className="h-4 w-4 mr-1.5" /> {newLabel}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const score = endSession.data;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold">{sessionData.eventName}</h1>
            <p className="text-xs text-muted-foreground">
              {sessionData.eventCode} · {headerSubtitle ?? "Roleplay Session"}
            </p>
          </div>
        </div>
        {(phase === "presenting" || phase === "followup") && (
          <div className={`flex items-center gap-2 text-sm font-mono ${presentTimeLeft < 120 ? "text-red-500" : "text-muted-foreground"}`}>
            <Clock className="h-4 w-4" />
            {formatTime(presentTimeLeft)}
          </div>
        )}
        {phase === "prep" && (
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <Clock className="h-4 w-4" />
            Prep: {formatTime(prepTimeLeft)}
          </div>
        )}
      </div>

      {/* PREP */}
      {phase === "prep" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Situation</CardTitle>
              <CardDescription>Read the scenario below. You have 10 minutes to prepare.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{sessionData.scenario}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-blue-500" /> Performance Indicators
              </CardTitle>
              <CardDescription>
                The judge will evaluate your presentation on these indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {sessionData.performanceIndicators.map((pi, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{pi}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" /> 21st Century Skills
              </CardTitle>
              <CardDescription>You will also be evaluated on these skills</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {sessionData.twentyFirstCenturySkills.map((skill, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    {skill}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleStartPresenting}>
            <Mic className="h-4 w-4 mr-2" /> I&apos;m Ready — Start Presentation
          </Button>
        </div>
      )}

      {/* PRESENTING / FOLLOW-UP */}
      {(phase === "presenting" || phase === "followup") && (
        <div className="space-y-4">
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Performance Indicators:</p>
              <div className="flex flex-wrap gap-1.5">
                {sessionData.performanceIndicators.map((pi, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal">
                    {i + 1}. {pi.length > 50 ? pi.substring(0, 50) + "..." : pi}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {messages.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}>
                          {msg.role === "judge" && (
                            <p className="text-[10px] font-medium mb-1 opacity-70">Judge</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Card className={`border-2 ${isListening ? "border-red-400 dark:border-red-600" : "border-border"}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {isListening ? (
                    <>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      Live Transcript
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      Transcript
                    </>
                  )}
                </CardTitle>
                {transcript && (
                  <span className="text-[10px] text-muted-foreground">
                    {transcript.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[150px] max-h-[300px] bg-muted/30 rounded-lg p-3 text-sm leading-relaxed resize-y border-0 focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder={!speechSupported
                  ? "Type your presentation response here..."
                  : isListening
                  ? "Listening... Start speaking and your words will appear here. You can also type or edit directly."
                  : "Press the mic button to speak, or just type your response here."}
                value={transcript + (interimTranscript ? interimTranscript : "")}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setInterimTranscript("");
                }}
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            {speechSupported && (
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                className="rounded-full h-14 w-14 shrink-0"
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
            )}
            <div className="flex-1 text-sm text-muted-foreground">
              {speechError ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{speechError}</span>
                </div>
              ) : !speechSupported ? (
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Speech recognition requires Chrome. Type your response in the box above instead.</span>
                </div>
              ) : isListening ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Recording... You can also type or edit in the box above
                </div>
              ) : (
                "Tap the mic to speak, or type in the box above"
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {transcript.trim() && (
              <Button className="flex-1" onClick={handleSubmitSpeech}>
                <Send className="h-4 w-4 mr-2" />
                {phase === "presenting" ? "Submit Presentation" : "Submit Answer"}
              </Button>
            )}
            <Button
              variant={transcript.trim() ? "outline" : "default"}
              className="flex-1"
              onClick={handleFinishRoleplay}
              disabled={endSession.isPending || (!transcript.trim() && messages.length === 0)}
            >
              {endSession.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scoring...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> End &amp; Get Score</>
              )}
            </Button>
          </div>

          {endSession.isError && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{endSession.error instanceof Error ? endSession.error.message : "Failed to submit. Please try again."}</span>
            </div>
          )}
        </div>
      )}

      {/* QUIZ */}
      {phase === "quiz" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Knowledge Check
              </CardTitle>
              <CardDescription>
                Answer all {quizQuestions.length} questions. Final score = roleplay (66.7%) + quiz (33.3%).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {quizAnswers.filter((a) => a !== null).length} of {quizQuestions.length} answered
                </span>
                <Progress
                  value={
                    quizQuestions.length === 0
                      ? 0
                      : (quizAnswers.filter((a) => a !== null).length / quizQuestions.length) * 100
                  }
                  className="h-2 flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {quizQuestions.map((q, qi) => (
            <Card key={qi}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  <span className="text-muted-foreground mr-2">{qi + 1}.</span>
                  {q.prompt}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, oi) => {
                    const selected = quizAnswers[qi] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => {
                          setQuizAnswers((prev) => {
                            const next = [...prev];
                            next[qi] = oi;
                            return next;
                          });
                        }}
                        className={`text-left text-sm rounded-lg border px-3 py-2 transition ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent/30"
                        }`}
                      >
                        <span className="text-muted-foreground mr-2">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {quizSubmitError && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{quizSubmitError}</span>
            </div>
          )}

          <Button
            className="w-full"
            disabled={
              quizSubmitting ||
              quizAnswers.some((a) => a === null) ||
              quizQuestions.length === 0
            }
            onClick={submitQuizAnswers}
          >
            {quizSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Submit Quiz</>
            )}
          </Button>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && score && (
        <div className="space-y-4">
          {quizResult ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-5xl font-bold">
                  {quizResult.totalScore}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </CardTitle>
                <CardDescription>Final Score (Roleplay + Quiz)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={quizResult.totalScore} className="h-3" />
                <div className="grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-semibold">{quizResult.roleplayScore}</p>
                    <p className="text-xs text-muted-foreground">Roleplay (66.7%)</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-semibold">{quizResult.quizScore}</p>
                    <p className="text-xs text-muted-foreground">Quiz (33.3%)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-5xl font-bold">
                  {score.totalScore}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </CardTitle>
                <CardDescription>Roleplay Performance Score</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={score.totalScore} className="h-3" />
              </CardContent>
            </Card>
          )}

          {score.overallFeedback && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm">{score.overallFeedback}</p>
              </CardContent>
            </Card>
          )}

          {score.piScores && score.piScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blue-500" /> Performance Indicator Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {score.piScores.map((pi, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground mr-1">PI {i + 1}:</span>
                        {pi.indicator}
                      </p>
                      <Badge variant={pi.score >= pi.maxPoints * 0.7 ? "default" : pi.score >= pi.maxPoints * 0.5 ? "secondary" : "destructive"}>
                        {pi.score}/{pi.maxPoints}
                      </Badge>
                    </div>
                    <Progress value={(pi.score / pi.maxPoints) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">{pi.feedback}</p>
                    {pi.level && (
                      <p className="text-[10px] text-muted-foreground italic">
                        Level: {pi.level}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {score.twentyFirstCenturyScores && score.twentyFirstCenturyScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" /> 21st Century Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {score.twentyFirstCenturyScores.map((skill, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{skill.skill}</p>
                      <Badge variant="outline">{skill.score}/{skill.maxPoints}</Badge>
                    </div>
                    <Progress value={(skill.score / skill.maxPoints) * 100} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(score.strengths || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" /> Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(score.improvements || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href={newHref}>
                <Sparkles className="h-4 w-4 mr-2" /> {newLabel}
              </Link>
            </Button>
          </div>
        </div>
      )}

      {phase === "results" && endSession.isPending && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">The judge is evaluating your performance...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
