"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  User,
  Hash,
} from "lucide-react";

const logoMaskStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, oklch(0.52 0.20 255), oklch(0.36 0.16 260))",
  WebkitMaskImage: "url(/logo-white.png)",
  maskImage: "url(/logo-white.png)",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
};

type Step = 1 | 2 | 3;

export function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialCode = (params.get("code") ?? "").replace(/[^\d]/g, "").slice(0, 6);

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid = displayName.trim().length > 0;
  const codeValid = /^\d{6}$/.test(code);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step === 1 && emailValid) setStep(2);
    else if (step === 2 && nameValid) setStep(3);
    else if (step === 3 && codeValid) submit();
  };

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/live-session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          displayName: displayName.trim(),
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not join this session.");
        setLoading(false);
        return;
      }
      if (data.completed) {
        router.push(`/play/${data.participantId}/results`);
      } else {
        router.push(`/play/${data.participantId}`);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.01_260)] relative overflow-hidden flex items-center justify-center p-6">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-[radial-gradient(ellipse,oklch(0.30_0.12_265/0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="absolute top-6 left-6 z-10">
        <Button variant="ghost" size="sm" asChild className="text-white/60 hover:text-white hover:bg-white/5">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-1.5" /> Home</Link>
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12" style={logoMaskStyle} />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Join a DUZZ Game</h1>
            <p className="text-sm text-white/40 mt-1">
              {step === 1 && "Step 1 of 3 — your email"}
              {step === 2 && "Step 2 of 3 — display name"}
              {step === 3 && "Step 3 of 3 — game code"}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleNext} className="space-y-4">
          {step === 1 && (
            <>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-white/30 leading-relaxed">
                Your email will be shared with the session host so they can follow up with results.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  type="text"
                  placeholder="How you'll show on the leaderboard"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 24))}
                  className="pl-10 h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30"
                  required
                  autoFocus
                  maxLength={24}
                />
              </div>
              <p className="text-[11px] text-white/30">
                Max 24 characters. This is what everyone else will see.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                  className="pl-10 h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 font-mono tracking-[0.3em] text-center"
                  required
                  autoFocus
                  maxLength={6}
                />
              </div>
              <p className="text-[11px] text-white/30">
                Get the code from your host&apos;s screen.
              </p>
            </>
          )}

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={
              loading ||
              (step === 1 && !emailValid) ||
              (step === 2 && !nameValid) ||
              (step === 3 && !codeValid)
            }
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining…</>
            ) : step === 3 ? (
              <>Join Game <ArrowRight className="h-4 w-4 ml-1.5" /></>
            ) : (
              <>Continue <ArrowRight className="h-4 w-4 ml-1.5" /></>
            )}
          </Button>

          {step > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-white/40 hover:text-white hover:bg-white/5"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
