"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  BookOpen,
  FolderOpen,
  Mic,
  User,
} from "lucide-react";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: BookOpen },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/roleplay", label: "Roleplay", icon: Mic },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full glass-panel border-r-0 border-y-0 rounded-none bg-background/50">
      <div className="flex items-center gap-3 p-5 border-b border-border/20">
        <Image src="/logo-white.png" alt="Nexari" width={36} height={36} className="w-9 h-9 dark:block hidden object-contain" />
        <Image src="/logo.png" alt="Nexari" width={36} height={36} className="w-9 h-9 dark:hidden block object-contain" />
        <span className="font-bold text-lg">Nexari</span>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-semibold transition-all duration-250",
                isActive
                  ? "glass-card text-primary"
                  : "text-foreground/70 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
