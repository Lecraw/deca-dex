"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Users,
  Clock,
  CircleDot,
  CircleSlash,
  ArrowRight,
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

type HostSession = {
  id: string;
  code: string;
  eventCode: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
  participantCount: number;
};

type DecaEvent = {
  id: string;
  code: string;
  name: string;
  eventType: string;
  category: string;
  teamMin: number;
};

export function HostDashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery<HostSession[]>({
    queryKey: ["host-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/host/session");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const { data: events = [] } = useQuery<DecaEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      return res.json();
    },
  });

  const roleplayEvents = events.filter((e) => e.eventType === "ROLEPLAY");
  const groups = [
    { label: "Principles Events", filter: (e: DecaEvent) => e.category === "PRINCIPLES_EVENTS" },
    { label: "Individual Series", filter: (e: DecaEvent) => e.category === "INDIVIDUAL_SERIES" },
    { label: "Team Decision Making", filter: (e: DecaEvent) => e.category === "TEAM_DECISION_MAKING" },
  ];

  const createSession = useMutation({
    mutationFn: async (eventCode: string) => {
      const res = await fetch("/api/host/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventCode }),
      });
      const text = await res.text();
      const jsonStr = text.replace(/^\s+/, "").trim();
      const jsonStart = jsonStr.indexOf("{");
      if (jsonStart === -1) throw new Error("Failed to create session.");
      const data = JSON.parse(jsonStr.substring(jsonStart));
      if (data.error) throw new Error(data.error);
      return data as { sessionId: string; code: string };
    },
    onSettled: () => {
      setCreating(null);
      qc.invalidateQueries({ queryKey: ["host-sessions"] });
    },
    onSuccess: (data) => {
      setPickerOpen(false);
      router.push(`/host/session/${data.sessionId}`);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-background/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <Link href="/host" className="flex items-center gap-2.5">
            <div className="w-7 h-7" style={logoMaskStyle} />
            <span className="font-bold tracking-tight">
              DUZZ <span className="text-muted-foreground font-normal">· Host</span>
            </span>
          </Link>
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Session
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a session, share the join code, and watch participants earn scores in real time.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
              <Button onClick={() => setPickerOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Create your first session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </main>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick a roleplay event</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {groups.map((g) => {
              const list = roleplayEvents.filter(g.filter);
              if (list.length === 0) return null;
              return (
                <div key={g.label} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{g.label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {list.map((ev) => (
                      <button
                        key={ev.code}
                        type="button"
                        className="text-left border rounded-lg p-3 hover:border-primary/60 hover:bg-accent/30 transition disabled:opacity-60"
                        disabled={!!creating}
                        onClick={() => {
                          if (creating) return;
                          setCreating(ev.code);
                          createSession.mutate(ev.code);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">{ev.code}</Badge>
                          {creating === ev.code ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm font-medium">{ev.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {createSession.isError && (
              <p className="text-xs text-red-500">
                {(createSession.error as Error).message}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionCard({ session }: { session: HostSession }) {
  const open = session.status === "open";
  return (
    <Link href={`/host/session/${session.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-mono tracking-widest">
              {session.code}
            </CardTitle>
            <Badge variant={open ? "default" : "secondary"} className="gap-1">
              {open ? (
                <><CircleDot className="h-3 w-3" /> Open</>
              ) : (
                <><CircleSlash className="h-3 w-3" /> Closed</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">{session.eventCode}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {session.participantCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {new Date(session.createdAt).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
