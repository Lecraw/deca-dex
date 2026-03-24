"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            : "Invalid email or password."
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 sm:px-6 relative overflow-hidden">
      
      {/* Glassmorphism Orbs */}
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      {/* Back button */}
      <Link href="/" className="absolute top-10 left-10 text-[15px] font-bold text-foreground/60 hover:text-primary transition-colors flex items-center gap-2">
        <ArrowRight className="h-5 w-5 rotate-180" />
        Back
      </Link>

      <div className="w-full max-w-[440px] relative z-10 glass-panel p-10 rounded-[2.5rem]">
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-16 h-16 rounded-3xl glass-card flex items-center justify-center mb-6">
            <Image src="/logo.png" alt="Nexari" width={40} height={40} className="w-10 h-10 object-contain dark:hidden" />
            <Image src="/logo-white.png" alt="Nexari" width={40} height={40} className="w-10 h-10 object-contain hidden dark:block" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-[16px] text-foreground/60 mt-3 text-center font-medium">
            {isRegister
              ? "Start building your DECA project today."
              : "Sign in to continue to Nexari."}
          </p>
        </div>
          
        <form onSubmit={handleCredentialSubmit} className="space-y-5">
          {isRegister && (
            <div className="space-y-2">
              <label className="text-[14px] font-bold px-2 text-foreground/80">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
                <input
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 h-14 rounded-2xl bg-white/5 dark:bg-black/20 border border-border/50 text-[16px] font-medium placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all backdrop-blur-sm"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[14px] font-bold px-2 text-foreground/80">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 h-14 rounded-2xl bg-white/5 dark:bg-black/20 border border-border/50 text-[16px] font-medium placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-bold px-2 text-foreground/80">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
              <input
                type="password"
                placeholder="Required"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 h-14 rounded-2xl bg-white/5 dark:bg-black/20 border border-border/50 text-[16px] font-medium placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all backdrop-blur-sm"
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/20 border border-destructive/30 text-[14px] text-destructive font-bold flex items-center justify-center">
              {error}
            </div>
          )}

          <button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold glass-btn-primary mt-4 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                {isRegister ? "Continue" : "Sign In"}
              </>
            )}
          </button>
        </form>

        {hasOAuth && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px border-t border-foreground/10" />
              </div>
              <div className="relative flex justify-center text-[12px] uppercase tracking-wider font-extrabold">
                <span className="px-4 text-foreground/50" style={{ background: "inherit" }}>
                  Or Login With
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {availableProviders.google && (
                <button
                  type="button"
                  className="w-full h-14 rounded-2xl font-bold glass-btn text-[16px] text-foreground flex items-center justify-center"
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading !== null}
                >
                  {oauthLoading === "google" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-foreground/50" />
                  ) : (
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Google
                </button>
              )}

              {availableProviders.github && (
                <button
                  type="button"
                  className="w-full h-14 rounded-2xl font-bold glass-btn text-[16px] text-foreground flex items-center justify-center"
                  onClick={() => handleOAuth("github")}
                  disabled={oauthLoading !== null}
                >
                  {oauthLoading === "github" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-foreground/50" />
                  ) : (
                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  )}
                  GitHub
                </button>
              )}
            </div>
          </>
        )}

        {/* Footer Link */}
        <p className="text-center text-[15px] text-foreground/60 mt-8">
          {isRegister ? "" : "Don't have an account? "}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-primary hover:text-primary/80 transition-colors font-bold"
          >
            {isRegister ? "Sign in to existing account" : "Create one now"}
          </button>
        </p>

      </div>
    </div>
  );
}
