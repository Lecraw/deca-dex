"use client";

import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LogOut, User, Menu, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNav } from "./MobileNav";
import { useTheme } from "next-themes";

export function Topbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session?.user,
  });

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpForNextLevel = level * 100;
  const xpProgress = Math.min((xp / xpForNextLevel) * 100, 100);

  return (
    <header className="sticky top-3 z-40 px-3 md:px-6 md:ml-60">
      <div className="backdrop-blur-2xl bg-background/80 dark:bg-background/60 border border-border/50 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="flex items-center justify-between h-14 px-5">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                <Menu className="h-4 w-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <MobileNav />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-1.5">
              <div
                className="w-7 h-7 shrink-0"
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
              <span className="font-bold text-sm tracking-tight">Nexari</span>
            </div>
          </div>

          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
        {/* XP indicator */}
        <div className="hidden sm:flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Lv.{level}
          </span>
          <Progress value={xpProgress} className="w-20 h-1.5 bg-muted-foreground/20" />
          <span className="text-[11px] font-bold text-primary">{xp} XP</span>
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-4 bg-border" />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-muted"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 hidden dark:block text-muted-foreground" />
          <Moon className="h-4 w-4 block dark:hidden text-muted-foreground" />
        </Button>

        {/* User Menu */}
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-8 w-8 rounded-full inline-flex items-center justify-center hover:opacity-80 transition-opacity">
              <Avatar className="h-8 w-8 rounded-full ring-1 ring-border/50">
                <AvatarImage
                  src={session.user.image || ""}
                  alt={session.user.name || ""}
                />
                <AvatarFallback className="rounded-full text-xs font-medium">
                  {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl shadow-xl mt-2 w-56 border-white/10 bg-background/80 backdrop-blur-2xl">
              <div className="flex items-center gap-3 p-3">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = "/profile"}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <a href="/login">Sign In</a>
          </Button>
        )}
          </div>
        </div>
      </div>
    </header>
  );
}
