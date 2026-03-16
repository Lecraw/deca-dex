"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

export default function LeaderboardPage() {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/gamification/leaderboard");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const rankIcons = [
    <Trophy key="1" className="h-5 w-5 text-yellow-500" />,
    <Medal key="2" className="h-5 w-5 text-gray-400" />,
    <Award key="3" className="h-5 w-5 text-amber-600" />,
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top Draftor users by XP earned
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            XP Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((user: any, i: number) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    i < 3 ? "bg-muted/50" : ""
                  }`}
                >
                  <span className="w-8 text-center">
                    {i < 3 ? rankIcons[i] : (
                      <span className="text-sm text-muted-foreground font-medium">
                        {i + 1}
                      </span>
                    )}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">
                      Level {user.level}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {user.xp.toLocaleString()} XP
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-1">No rankings yet</h3>
              <p className="text-sm text-muted-foreground">
                Start building projects to earn XP and climb the leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
