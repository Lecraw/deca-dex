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
    <header className="flex items-center justify-between h-14 px-5 border-b border-border/20 bg-background/50 backdrop-blur-2xl sticky top-0 z-40 noise-bg">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center h-10 w-10 rounded-2xl skeuo-card text-foreground transition-all active:scale-95">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileNav />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-1.5">
          <Image src="/logo-white.png" alt="Nexari" width={28} height={28} className="w-7 h-7 dark:block hidden object-contain" />
          <Image src="/logo.png" alt="Nexari" width={28} height={28} className="w-7 h-7 dark:hidden block object-contain" />
          <span className="font-bold text-sm tracking-tight">Nexari</span>
        </div>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        {/* XP indicator */}
        <div className="hidden sm:flex items-center gap-3 skeuo-inset px-4 py-1.5 rounded-full">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest drop-shadow-sm">
            Lv.{level}
          </span>
          <div className="w-20 h-2 bg-black/10 dark:bg-black/40 rounded-full shadow-inner overflow-hidden relative">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-primary shadow-sm"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-primary drop-shadow-sm">{xp} XP</span>
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-5 border-r border-white/10 dark:border-white/5" />

        {/* Theme Toggle */}
        <button
          className="h-9 w-9 rounded-full skeuo-card flex items-center justify-center active:scale-95 transition-transform"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-[18px] w-[18px] hidden dark:block text-muted-foreground drop-shadow-sm" />
          <Moon className="h-[18px] w-[18px] block dark:hidden text-muted-foreground drop-shadow-sm" />
        </button>

        {/* User Menu */}
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-10 w-10 rounded-full inline-flex items-center justify-center hover:opacity-90 active:scale-95 transition-all outline-none">
              <Avatar className="h-10 w-10 rounded-full skeuo-card p-[2px]">
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
    </header>
  );
}
