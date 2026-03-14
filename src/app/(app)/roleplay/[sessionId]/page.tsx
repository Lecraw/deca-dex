"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
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

interface Message {
  role: "user" | "judge";
  content: string;
  timestamp: string;
}

interface SessionData {
  id: string;
  eventCode: string;
  eventName: string;
  eventCategory: string;
  scenario: string;
  performanceIndicators: string[];
  twentyFirstCenturySkills: string[];
  judgeFollowUpQuestions: string[];
  messages: Message[];
  completed: boolean;
  score: any;
}

export default function RoleplaySessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [phase, setPhase] = useState<"prep" | "presenting" | "followup" | "results">("prep");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [prepTimeLeft, setPrepTimeLeft] = useState(600); // 10 minutes
  const [presentTimeLeft, setPresentTimeLeft] = useState(600); // 10 minutes
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const presentTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch session data
  const { data: session, isLoading } = useQuery<SessionData>({
    queryKey: ["roleplay-session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/ai/roleplay?sessionId=${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session");
      return res.json();
    },
  });

  // Check for speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript]);

  // Prep timer
  useEffect(() => {
    if (phase === "prep") {
      prepTimerRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepTimerRef.current!);
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

  // Present timer
  useEffect(() => {
    if (phase === "presenting" || phase === "followup") {
      presentTimerRef.current = setInterval(() => {
        setPresentTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(presentTimerRef.current!);
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

  // Initialize speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
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
      if (final) {
        setTranscript((prev) => prev + " " + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setSpeechSupported(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still listening
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  // Submit the user's spoken response
  const submitResponse = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/ai/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_response",
          sessionId,
          transcript: text,
          phase,
        }),
      });
      return res.json();
    },
  });

  // End session and get final score
  const endSession = useMutation({
    mutationFn: async (overrideTranscript?: string) => {
      const allMessages = overrideTranscript || messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
      const res = await fetch("/api/ai/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end_session",
          sessionId,
          fullTranscript: allMessages,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPhase("results");
    },
  });

  const handleStartPresenting = () => {
    setPhase("presenting");
  };

  const handleSubmitSpeech = () => {
    const text = transcript.trim();
    if (!text) return;

    stopListening();

    // Add user message
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTranscript("");
    setInterimTranscript("");

    if (phase === "presenting") {
      // After initial presentation, move to follow-up questions
      setPhase("followup");
      // Show first follow-up question
      if (session?.judgeFollowUpQuestions && session.judgeFollowUpQuestions.length > 0) {
        setTimeout(() => {
          const judgeMsg: Message = {
            role: "judge",
            content: session.judgeFollowUpQuestions[0],
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, judgeMsg]);
          setFollowUpIndex(1);
        }, 1000);
      }
    } else if (phase === "followup") {
      // Show next follow-up question or finish
      if (session?.judgeFollowUpQuestions && followUpIndex < session.judgeFollowUpQuestions.length) {
        setTimeout(() => {
          const judgeMsg: Message = {
            role: "judge",
            content: session.judgeFollowUpQuestions[followUpIndex],
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, judgeMsg]);
          setFollowUpIndex(followUpIndex + 1);
        }, 1000);
      } else {
        // All follow-ups answered, add thank you message
        setTimeout(() => {
          const judgeMsg: Message = {
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
    // Include any unsent transcript in messages before ending
    const pendingText = transcript.trim();
    if (pendingText) {
      const userMsg: Message = {
        role: "user",
        content: pendingText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => {
        const updated = [...prev, userMsg];
        // Use updated messages for the API call
        const allMessages = updated.map((m) => `${m.role}: ${m.content}`).join("\n\n");
        stopListening();
        setTranscript("");
        setInterimTranscript("");
        endSession.mutate(allMessages);
        return updated;
      });
    } else {
      stopListening();
      endSession.mutate(undefined);
    }
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

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session not found</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/roleplay"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
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
            <Link href="/roleplay"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold">{session.eventName}</h1>
            <p className="text-xs text-muted-foreground">{session.eventCode} · Roleplay Session</p>
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

      {/* ============ PREP PHASE ============ */}
      {phase === "prep" && (
        <div className="space-y-4">
          {/* Scenario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Situation</CardTitle>
              <CardDescription>Read the scenario below. You have 10 minutes to prepare.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{session.scenario}</p>
            </CardContent>
          </Card>

          {/* Performance Indicators */}
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
                {session.performanceIndicators.map((pi, i) => (
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

          {/* 21st Century Skills */}
          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" /> 21st Century Skills
              </CardTitle>
              <CardDescription>You will also be evaluated on these skills</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {session.twentyFirstCenturySkills.map((skill, i) => (
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

      {/* ============ PRESENTING / FOLLOW-UP PHASE ============ */}
      {(phase === "presenting" || phase === "followup") && (
        <div className="space-y-4">
          {/* Compact PI reference */}
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Performance Indicators:</p>
              <div className="flex flex-wrap gap-1.5">
                {session.performanceIndicators.map((pi, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal">
                    {i + 1}. {pi.length > 50 ? pi.substring(0, 50) + "..." : pi}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversation Area — past messages */}
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

          {/* Live Transcript Box */}
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
              <div className="min-h-[150px] max-h-[300px] overflow-y-auto bg-muted/30 rounded-lg p-3 text-sm leading-relaxed">
                {!transcript && !interimTranscript && (
                  <p className="text-muted-foreground italic">
                    {isListening
                      ? "Listening... Start speaking and your words will appear here"
                      : "Press the microphone button below to start speaking. Your speech will be transcribed here in real time."}
                  </p>
                )}
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground">{interimTranscript}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!speechSupported ? (
              <Card className="flex-1 border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
                <CardContent className="p-3">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    Speech recognition is not supported in this browser. Please use Chrome for the best experience, or type your response below.
                  </p>
                  <textarea
                    className="mt-2 w-full bg-background border rounded-md p-2 text-sm min-h-[80px]"
                    placeholder="Type your response..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <Button
                  size="lg"
                  variant={isListening ? "destructive" : "default"}
                  className="rounded-full h-14 w-14 shrink-0"
                  onClick={isListening ? stopListening : startListening}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                <div className="flex-1 text-sm text-muted-foreground">
                  {isListening ? (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      Recording... Speak clearly into your microphone
                    </div>
                  ) : (
                    "Tap the mic to start speaking"
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            {transcript.trim() && phase === "followup" && (
              <Button className="flex-1" onClick={handleSubmitSpeech}>
                <Send className="h-4 w-4 mr-2" />
                Submit Answer
              </Button>
            )}
            <Button
              variant={transcript.trim() || messages.length > 0 ? "default" : "outline"}
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
        </div>
      )}

      {/* ============ RESULTS PHASE ============ */}
      {phase === "results" && score && (
        <div className="space-y-4">
          {/* Total Score */}
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

          {/* Overall Feedback */}
          {score.overallFeedback && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm">{score.overallFeedback}</p>
              </CardContent>
            </Card>
          )}

          {/* PI Scores */}
          {score.piScores && score.piScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-blue-500" /> Performance Indicator Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {score.piScores.map((pi: any, i: number) => (
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
                    <p className="text-[10px] text-muted-foreground italic">
                      Level: {pi.level}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 21st Century Skills Scores */}
          {score.twentyFirstCenturyScores && score.twentyFirstCenturyScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" /> 21st Century Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {score.twentyFirstCenturyScores.map((skill: any, i: number) => (
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

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(score.strengths || []).map((s: string, i: number) => (
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
                  {(score.improvements || []).map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/roleplay">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Events
              </Link>
            </Button>
            <Button className="flex-1" asChild>
              <Link href="/roleplay">
                <Sparkles className="h-4 w-4 mr-2" /> New Roleplay
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Loading state for scoring */}
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
