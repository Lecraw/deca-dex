"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState(errorParam || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [availableProviders, setAvailableProviders] = useState<{
    google: boolean;
    github: boolean;
  }>({ google: false, github: false });

  useEffect(() => {
    fetch("/api/auth/providers-info")
      .then((r) => r.json())
      .then(setAvailableProviders)
      .catch(() => {});
  }, []);

  const hasOAuth = availableProviders.google || availableProviders.github;

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Registration failed");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          isRegister
            ? "Account created but login failed. Try signing in."
            : "Invalid email or password"
        );
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    setOauthLoading(provider);
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[oklch(0.06_0.01_260)] relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-[radial-gradient(circle,oklch(0.30_0.12_265/0.15)_0%,transparent_70%)] pointer-events-none" />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/logo-white.png" alt="" width={600} height={600} className="w-[500px] h-[500px] opacity-[0.02] object-contain" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 shrink-0"
              style={{
                background: "linear-gradient(135deg, oklch(0.52 0.20 255), oklch(0.36 0.16 260))",
                WebkitMaskImage: "url(/logo-white.png)",
                maskImage: "url(/logo-white.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
            <span className="font-bold text-lg tracking-tight">Nexari</span>
          </div>

          <div className="space-y-8 max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">Futuristic DECA Preparation</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Build Winning DECA Projects{" "}
              <span className="text-primary">with AI</span>
            </h1>
            <p className="text-white/40 text-base leading-relaxed">
              From idea generation to judge-ready pitch decks. AI mentoring,
              compliance checking, and roleplay practice — all in one platform.
            </p>
            <div className="flex flex-col gap-3 text-sm text-white/25">
              {[
                "AI-powered idea generation for every DECA event",
                "Automatic rubric scoring & compliance checks",
                "Roleplay practice with an AI judge",
                "Export to PowerPoint, Word & PDF",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-px h-3 bg-primary/50" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-white/15 uppercase tracking-wider">
            Not affiliated with DECA Inc.
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
            <div
              className="w-10 h-10 shrink-0"
              style={{
                background: "linear-gradient(135deg, oklch(0.52 0.20 255), oklch(0.36 0.16 260))",
                WebkitMaskImage: "url(/logo-white.png)",
                maskImage: "url(/logo-white.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
            <span className="font-bold text-xl">Nexari</span>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRegister
                ? "Start building your DECA project today"
                : "Sign in to continue to Nexari"}
            </p>
          </div>

          {hasOAuth && (
            <>
              <div className="space-y-3">
                {availableProviders.google && (
                  <Button
                    variant="outline"
                    className="w-full h-11 gap-2"
                    onClick={() => handleOAuth("google")}
                    disabled={oauthLoading !== null}
                  >
                    {oauthLoading === "google" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                )}

                {availableProviders.github && (
                  <Button
                    variant="outline"
                    className="w-full h-11 gap-2"
                    onClick={() => handleOAuth("github")}
                    disabled={oauthLoading !== null}
                  >
                    {oauthLoading === "github" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    )}
                    Continue with GitHub
                  </Button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            {isRegister && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-11"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder={isRegister ? "Create password (6+ chars)" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-10 h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isRegister ? "Create Account" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-primary hover:underline font-medium"
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
