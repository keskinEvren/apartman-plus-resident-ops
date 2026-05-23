"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  UserPlus,
  Package,
  LifeBuoy,
  Megaphone,
  Settings,
} from "lucide-react";

const navSections = [
  {
    title: "Genel",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Operasyonlar",
    items: [
      {
        href: "/dashboard/bookings",
        label: "Rezervasyonlar",
        icon: CalendarDays,
      },
      { href: "/dashboard/visitors", label: "Ziyaretçiler", icon: UserPlus },
      { href: "/dashboard/packages", label: "Kargo Takip", icon: Package },
      { href: "/dashboard/tickets", label: "Destek Talepleri", icon: LifeBuoy },
    ],
  },
  {
    title: "Yönetim",
    items: [
      { href: "/dashboard/announcements", label: "Duyurular", icon: Megaphone },
      { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-64 glass-surface border-r border-white/[0.06] flex flex-col",
        className,
      )}
    >
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary shadow-glow"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 h-6 w-[3px] rounded-r-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive && "text-primary",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom branding */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            A+
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">Apartman Plus</p>
            <p className="text-[10px] text-muted-foreground truncate">
              Resident Ops
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
