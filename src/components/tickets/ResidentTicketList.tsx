"use client";

import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Calendar, AlertTriangle } from "lucide-react";

interface ResidentTicketListProps {
  tickets: any[];
  categoryIcons: Record<string, any>;
  categoryLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  onSelect: (ticket: any) => void;
}

export function ResidentTicketList({
  tickets,
  categoryIcons,
  categoryLabels,
  statusLabels,
  statusColors,
  onSelect,
}: ResidentTicketListProps) {
  if (tickets.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Destek talebi bulunamadı</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Henüz bir destek talebi oluşturmadınız.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {tickets.map((ticket) => {
        const Icon = categoryIcons[ticket.category] || categoryIcons.OTHER;
        return (
          <GlassCard
            key={ticket.id}
            className="gradient-border hover:scale-[1.005] hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
            onClick={() => onSelect(ticket)}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/[0.04] border border-white/[0.06] text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-foreground truncate max-w-md">{ticket.title}</span>
                    <span className="text-xs text-muted-foreground/80 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-lg font-medium">
                      {categoryLabels[ticket.category]}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusColors[ticket.status]}`}>
                      {statusLabels[ticket.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 max-w-2xl">{ticket.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(ticket.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
