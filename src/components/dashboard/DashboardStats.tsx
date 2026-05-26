"use client";

import React from "react";
import Link from "next/link";
import { Package, LifeBuoy, CalendarDays, UserPlus } from "lucide-react";

interface DashboardStatsProps {
  pendingPkgsCount: number;
  openTktsCount: number;
  activeResCount: number;
  visitorsCount: number;
  loading: boolean;
}

export function DashboardStats({
  pendingPkgsCount,
  openTktsCount,
  activeResCount,
  visitorsCount,
  loading,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Bekleyen Kargo",
      value: pendingPkgsCount,
      icon: Package,
      href: "/dashboard/packages",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Açık Destek Talebi",
      value: openTktsCount,
      icon: LifeBuoy,
      href: "/dashboard/tickets",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Aktif Rezervasyon",
      value: activeResCount,
      icon: CalendarDays,
      href: "/dashboard/bookings",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Beklenen Ziyaretçi",
      value: visitorsCount,
      icon: UserPlus,
      href: "/dashboard/visitors",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Link
            key={s.label}
            href={s.href}
            className="p-4 rounded bg-card border border-border flex items-center justify-between hover:bg-secondary/40 transition-colors"
          >
            <div className="space-y-1">
              <p className="text-2xl font-bold font-heading text-foreground">
                {loading ? "..." : s.value}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {s.label}
              </p>
            </div>
            <div
              className={`h-8 w-8 rounded flex items-center justify-center ${s.bg} ${s.color}`}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
