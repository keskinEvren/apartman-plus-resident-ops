import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { LifeBuoy } from "lucide-react";

interface TicketStatsProps {
  pendingCount: number;
}

export function TicketStats({ pendingCount }: TicketStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <GlassCard className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <LifeBuoy className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold font-heading">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">
            Aktif / İşlemdeki Talepler
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
