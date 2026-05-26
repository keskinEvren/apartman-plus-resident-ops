"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  Settings,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab");

  const navItems = [
    {
      href: "/dashboard",
      label: "Genel Bakış",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/bookings",
      label: "Rezervasyon",
      icon: CalendarDays,
      isActive: pathname === "/dashboard/bookings",
    },
    {
      href: "/dashboard/announcements",
      label: "Duyurular",
      icon: Megaphone,
      isActive: pathname === "/dashboard/announcements",
    },
    {
      href: "/dashboard/settings?tab=ACCOUNT",
      label: "Ayarlar",
      icon: Settings,
      isActive:
        pathname === "/dashboard/settings" || activeTabParam === "ACCOUNT",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-card/90 backdrop-blur-md border-t border-border flex items-center justify-around px-2 shadow-lg lg:hidden pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-20 h-full text-[10px] font-semibold transition-all duration-200 relative",
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.isActive && (
              <span className="absolute top-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
            )}
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
