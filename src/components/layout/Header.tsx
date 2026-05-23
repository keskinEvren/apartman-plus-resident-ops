"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

interface HeaderProps {
  className?: string;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

export function Header({
  className,
  unreadCount = 0,
  onNotificationClick,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full h-14 glass-surface border-b border-white/[0.06]",
        className,
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
            A+
          </div>
          <span className="font-heading text-lg font-bold bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent">
            Apartman Plus
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNotificationClick}
            className="relative rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
            aria-label="Bildirimler"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white animate-badge-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
