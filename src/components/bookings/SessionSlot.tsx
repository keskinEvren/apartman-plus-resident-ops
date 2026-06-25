"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Clock, Users } from "lucide-react";

interface SessionSlotProps {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function SessionSlot({
  id,
  startTime,
  endTime,
  capacity,
  bookedCount,
  isSelected,
  onSelect,
}: SessionSlotProps) {
  const isFull = bookedCount >= capacity;
  const fillPercent = Math.min((bookedCount / capacity) * 100, 100);

  return (
    <button
      onClick={() => !isFull && onSelect(id)}
      disabled={isFull}
      className={cn(
        "relative rounded-xl px-4 py-3 text-left transition-all duration-200",
        "bg-card border border-border",
        isFull
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-secondary cursor-pointer",
        isSelected && !isFull && "ring-2 ring-primary shadow-card",
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-semibold">
          {startTime} – {endTime}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>
            {bookedCount}/{capacity} kişi
          </span>
        </div>
        {isFull && (
          <span className="text-[10px] font-semibold text-red-600 uppercase">
            Dolu
          </span>
        )}
      </div>

      {/* Capacity bar */}
      <div className="mt-2 h-1 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isFull
              ? "bg-red-500/60"
              : fillPercent > 70
                ? "bg-amber-500/60"
                : "bg-primary/50",
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </button>
  );
}
