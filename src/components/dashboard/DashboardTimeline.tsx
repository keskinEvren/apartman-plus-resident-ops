"use client";

import React from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface DashboardTimelineProps {
  notifications: any[];
  loading: boolean;
}

export function DashboardTimeline({
  notifications,
  loading,
}: DashboardTimelineProps) {
  return (
    <div className="lg:col-span-8 p-5 rounded bg-card border border-border space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Son Aktiviteler
        </h2>
        <span className="text-[10px] text-muted-foreground">
          {notifications.length} Bildirim
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-10">
          Son zamanlarda gerçekleşmiş bir aktivite bulunmuyor.
        </p>
      ) : (
        <div className="relative pl-4 border-l border-border/60 ml-2 space-y-4">
          {notifications.slice(0, 5).map((n) => (
            <div key={n.id} className="relative space-y-0.5">
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card" />
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-foreground">
                  {n.title}
                </p>
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString("tr-TR")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {n.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
