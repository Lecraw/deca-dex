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
  ChevronLeft,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/event-catalog", label: "Events", icon: BookOpen },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/roleplay", label: "Roleplay", icon: Mic },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-background/60 backdrop-blur-2xl transition-all duration-300 relative z-10 border-r border-white/5 dark:border-white/10",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo area */}
      <div className={cn(
        "flex items-center",
        collapsed ? "justify-center p-3" : "gap-3 p-5"
      )}>
        {!collapsed && (
          <>
            <Image src="/logo-white.png" alt="Nexari" width={32} height={32} className="w-8 h-8 shrink-0 dark:block hidden object-contain" />
            <Image src="/logo.png" alt="Nexari" width={32} height={32} className="w-8 h-8 shrink-0 dark:hidden block object-contain" />
            <span className="font-bold text-base tracking-tight">Nexari</span>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 shrink-0", !collapsed && "ml-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-250 relative",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive && "scale-105")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom accent */}
      <div className="px-4 pb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </aside>
  );
}
