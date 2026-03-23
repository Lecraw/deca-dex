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
        "hidden md:flex flex-col bg-card/50 backdrop-blur-sm transition-all duration-300 relative z-10 border-r border-border/50",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo area */}
      <div className={cn(
        "flex items-center border-b border-border/50",
        collapsed ? "justify-center p-3" : "gap-2 p-4"
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
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-sm shadow-[0_0_8px_oklch(0.50_0.16_255/0.4)]" />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0", isActive && "drop-shadow-[0_0_4px_oklch(0.50_0.16_255/0.4)]")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom accent */}
      <div className="px-4 pb-4">
        <div className="h-px bg-gradient-to-r from-primary/20 to-transparent" />
      </div>
    </aside>
  );
}
