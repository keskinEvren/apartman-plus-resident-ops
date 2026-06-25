"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, CalendarDays, UserPlus, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickActionFab() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleAction = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const actions = [
    {
      label: "Rezervasyon Yap",
      description: "Tesis veya ortak alan seansı rezerve edin",
      icon: CalendarDays,
      href: "/dashboard/bookings",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Yeni Ziyaretçi Ekle",
      description: "Bugün beklediğiniz konukları kaydedin",
      icon: UserPlus,
      href: "/dashboard/visitors",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
    {
      label: "Destek Talebi Oluştur",
      description: "Tesis sorunları için yeni kayıt açın",
      icon: LifeBuoy,
      href: "/dashboard/tickets",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 lg:hidden hover:scale-105 active:scale-95 border border-primary/20",
          isOpen &&
            "rotate-135 bg-destructive text-destructive-foreground border-destructive/20",
        )}
        aria-label="Hızlı İşlem Menüsü"
      >
        <Plus className="h-6 w-6 transition-transform duration-300" />
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden animate-fade-in"
        />
      )}

      {/* Dynamic Mobile Quick Action Sheet (Bottom Sheet) */}
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border rounded-t-2xl p-5 space-y-4 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden pb-safe",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Hızlı İşlemler
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                onClick={() => handleAction(act.href)}
                className="w-full p-3 rounded-xl border border-border bg-secondary/20 flex items-center gap-4 hover:bg-secondary/40 active:scale-[0.99] transition-all text-left group"
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    act.bg,
                    act.color,
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {act.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {act.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
