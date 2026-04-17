"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

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

export default function HostLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/host/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/host");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Invalid password");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[oklch(0.06_0.01_260)] relative overflow-hidden p-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-[radial-gradient(ellipse,oklch(0.30_0.12_265/0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12" style={logoMaskStyle} />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">DUZZ Live · Host</h1>
            <p className="text-sm text-white/40 mt-1">Enter the host password to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              type="password"
              placeholder="Host password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30"
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading || !password}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
            ) : (
              <><ShieldCheck className="h-4 w-4 mr-2" /> Unlock Host</>
            )}
          </Button>
        </form>

        <p className="text-[11px] text-white/20 text-center uppercase tracking-wider">
          Authorized hosts only
        </p>
      </div>
    </div>
  );
}
