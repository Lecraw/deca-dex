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
  { href: "/events", label: "Events", icon: BookOpen },
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
        "hidden md:flex flex-col border-r bg-card transition-all duration-300 relative z-10",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex items-center border-b", collapsed ? "justify-center p-3" : "gap-2 p-4")}>
        {!collapsed && (
          <>
            <Image src="/logo-white.png" alt="Nexari" width={36} height={36} className="w-9 h-9 shrink-0 dark:block hidden" />
            <Image src="/logo.png" alt="Nexari" width={36} height={36} className="w-9 h-9 shrink-0 dark:hidden block" />
            <span className="font-bold text-lg tracking-tight">Nexari</span>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", !collapsed && "ml-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
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
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
