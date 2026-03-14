"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Users,
  Clock,
  Presentation,
  FileText,
  MessageSquare,
  Monitor,
  Building2,
  Lightbulb,
  DollarSign,
  Globe,
  ShoppingBag,
  Wallet,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const clusterConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  BUSINESS_MANAGEMENT: {
    label: "Business Management & Administration",
    icon: <Building2 className="h-5 w-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  ENTREPRENEURSHIP: {
    label: "Entrepreneurship",
    icon: <Lightbulb className="h-5 w-5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
  FINANCE: {
    label: "Finance",
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-green-500",
    bgColor: "bg-green-500/10 border-green-500/20",
  },
  HOSPITALITY_TOURISM: {
    label: "Hospitality & Tourism",
    icon: <Globe className="h-5 w-5" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10 border-purple-500/20",
  },
  MARKETING: {
    label: "Marketing",
    icon: <ShoppingBag className="h-5 w-5" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10 border-pink-500/20",
  },
  PERSONAL_FINANCIAL_LITERACY: {
    label: "Personal Financial Literacy",
    icon: <Wallet className="h-5 w-5" />,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10 border-teal-500/20",
  },
};

const typeIcons: Record<string, React.ReactNode> = {
  PITCH_DECK: <Presentation className="h-4 w-4" />,
  WRITTEN_REPORT: <FileText className="h-4 w-4" />,
  ROLEPLAY: <MessageSquare className="h-4 w-4" />,
  ONLINE_SIMULATION: <Monitor className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  PITCH_DECK: "Pitch Deck",
  WRITTEN_REPORT: "Written Report",
  ROLEPLAY: "Roleplay",
  ONLINE_SIMULATION: "Online Simulation",
};

const typeColors: Record<string, string> = {
  PITCH_DECK: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  WRITTEN_REPORT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ROLEPLAY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  ONLINE_SIMULATION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

interface DecaEventResponse {
  id: string;
  code: string;
  name: string;
  cluster: string;
  category: string;
  eventType: string;
  teamMin: number;
  teamMax: number;
  presentationMin: number | null;
  description: string;
  hasExam: boolean;
}

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set(Object.keys(clusterConfig)));

  const { data: events = [], isLoading } = useQuery<DecaEventResponse[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const filtered = events.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && e.eventType !== typeFilter) return false;
    return true;
  });

  // Group events by cluster
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, DecaEventResponse[]>();
    const clusterOrder = Object.keys(clusterConfig);
    clusterOrder.forEach((c) => groups.set(c, []));
    filtered.forEach((e) => {
      const existing = groups.get(e.cluster) || [];
      existing.push(e);
      groups.set(e.cluster, existing);
    });
    // Remove empty groups
    for (const [key, value] of groups) {
      if (value.length === 0) groups.delete(key);
    }
    return groups;
  }, [filtered]);

  const toggleCluster = (cluster: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(cluster)) {
        next.delete(cluster);
      } else {
        next.add(cluster);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">DECA Events</h1>
        <p className="text-muted-foreground">
          Browse all {events.length} competitive events organized by career cluster
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedClusters(new Set(Object.keys(clusterConfig)))}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedClusters(new Set())}
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Event Groups by Cluster */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-24 bg-muted rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedEvents.entries()).map(([cluster, clusterEvents]) => {
            const config = clusterConfig[cluster];
            const isExpanded = expandedClusters.has(cluster);
            return (
              <div key={cluster} className={`rounded-lg border ${config?.bgColor || "bg-muted/50"}`}>
                <button
                  onClick={() => toggleCluster(cluster)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 rounded-t-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={config?.color}>{config?.icon}</span>
                    <div className="text-left">
                      <h2 className="font-semibold text-base">
                        {config?.label || cluster}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {clusterEvents.length} event{clusterEvents.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {clusterEvents.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`}>
                        <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-background/80">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">
                                {event.code}
                              </Badge>
                              <Badge className={`text-xs ${typeColors[event.eventType] || ""}`}>
                                <span className="mr-1">{typeIcons[event.eventType]}</span>
                                {typeLabels[event.eventType]}
                              </Badge>
                            </div>
                            <CardTitle className="text-sm leading-tight">
                              {event.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.teamMin === event.teamMax
                                  ? `${event.teamMin}`
                                  : `${event.teamMin}-${event.teamMax}`}
                              </span>
                              {event.presentationMin && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.presentationMin}m
                                </span>
                              )}
                              {event.hasExam && (
                                <Badge variant="secondary" className="text-xs py-0">
                                  Exam
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events match your filters.</p>
        </div>
      )}
    </div>
  );
}
