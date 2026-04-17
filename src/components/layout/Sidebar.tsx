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
        "hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-10 transition-all duration-300",
        collapsed ? "w-20" : "w-60"
      )}
    >
      <div className="flex flex-col h-full m-3 backdrop-blur-2xl bg-background/80 dark:bg-background/60 border border-border/50 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20">
        {/* Logo area */}
        <div className={cn(
          "flex items-center border-b border-border/30",
          collapsed ? "justify-center p-4" : "gap-3 p-5"
        )}>
          <div
            className={cn("shrink-0 transition-all duration-300", collapsed ? "w-9 h-9" : "w-8 h-8")}
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
          {!collapsed && (
            <span className="font-bold text-base tracking-tight">DUZZ</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7 shrink-0 rounded-full hover:bg-accent/50", !collapsed && "ml-auto")}
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
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive && "scale-110")} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom accent */}
        <div className="p-4 border-t border-border/30">
          <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full" />
        </div>
      </div>
    </aside>
  );
}
