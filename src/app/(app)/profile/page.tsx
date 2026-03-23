"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Trophy,
  Flame,
  FolderOpen,
  Star,
  Lightbulb,
  Rocket,
  Target,
  FileText,
  Presentation,
  CheckCircle,
  MessageCircle,
  BarChart,
  Mic,
  Zap,
  Crown,
  Clock,
  Key,
  Copy,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";
import { useState } from "react";

const badgeIcons: Record<string, any> = {
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  rocket: Rocket,
  "folder-open": FolderOpen,
  presentation: Presentation,
  "file-text": FileText,
  trophy: Trophy,
  "check-circle": CheckCircle,
  "message-circle": MessageCircle,
  "bar-chart": BarChart,
  mic: Mic,
  flame: Flame,
  zap: Zap,
  crown: Crown,
  "alarm-clock": Clock,
};

export default function ProfilePage() {
  const { data: session } = useSession();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.streakDays ?? 0;
  const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000];
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 5000;
  const xpInLevel = xp - currentThreshold;
  const xpNeededForLevel = nextThreshold - currentThreshold;
  const xpProgress = Math.min((xpInLevel / xpNeededForLevel) * 100, 100);
  const badges = profile?.badges ?? [];
  const counts = profile?._count ?? {};

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="text-xl">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{session?.user?.name || "Student"}</h2>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge>Level {level}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {xp} XP
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3 w-3" /> {streak} day streak
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {level}</span>
              <span className="text-muted-foreground">{xp} / {nextThreshold} XP to Level {level + 1}</span>
            </div>
            <Progress value={xpProgress} />
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" /> Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Complete tasks to earn badges! Create projects, run judge simulations,
              and build your DECA skills.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((ub: any) => {
                const IconComp = badgeIcons[ub.badge?.icon] || Star;
                return (
                  <div
                    key={ub.id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <IconComp className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ub.badge?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ub.badge?.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Projects", value: counts.projects ?? 0, icon: FolderOpen },
              { label: "AI Feedbacks", value: counts.feedbackItems ?? 0, icon: MessageCircle },
              { label: "Tasks", value: counts.plannerTasks ?? 0, icon: CheckCircle },
              { label: "Roleplays", value: counts.roleplaySessions ?? 0, icon: Mic },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Tokens */}
      <ApiTokensSection />
    </div>
  );
}

function ApiTokensSection() {
  const queryClient = useQueryClient();
  const [newTokenName, setNewTokenName] = useState("Browser Extension");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: tokens = [] } = useQuery({
    queryKey: ["api-tokens"],
    queryFn: async () => {
      const res = await fetch("/api/auth/extension-token");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createToken = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/extension-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName }),
      });
      if (!res.ok) throw new Error("Failed to create token");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
  });

  const deleteToken = useMutation({
    mutationFn: async (tokenId: string) => {
      await fetch(`/api/auth/extension-token?id=${tokenId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
  });

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" /> API Tokens
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate tokens for the Nexari browser extension
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Generated token display */}
        {generatedToken && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <p className="text-xs font-medium text-primary">
              Token generated — copy it now, it won't be shown again
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                {generatedToken}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToken}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {/* Create new token */}
        <div className="flex items-center gap-2">
          <Input
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            placeholder="Token name"
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={() => createToken.mutate()}
            disabled={createToken.isPending || !newTokenName.trim()}
          >
            {createToken.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Generate
              </>
            )}
          </Button>
        </div>

        {/* Token list */}
        {tokens.length > 0 && (
          <div className="space-y-2">
            {tokens.map((token: any) => (
              <div
                key={token.id}
                className="flex items-center justify-between p-3 rounded-lg border text-sm"
              >
                <div>
                  <p className="font-medium">{token.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created{" "}
                    {new Date(token.createdAt).toLocaleDateString()}
                    {token.lastUsedAt &&
                      ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteToken.mutate(token.id)}
                  disabled={deleteToken.isPending}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {tokens.length === 0 && !generatedToken && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No tokens yet. Generate one to use with the browser extension.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
