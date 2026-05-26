"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Dumbbell } from "lucide-react";

interface AmenityCardProps {
  id: string;
  name: string;
  description?: string | null;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function AmenityCard({
  id,
  name,
  description,
  isSelected,
  onSelect,
}: AmenityCardProps) {
  // Stable mock occupancy percent based on id
  const getOccupancyPercent = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 50) + 25; // 25% to 75% range
  };

  const occupancy = getOccupancyPercent(id);

  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        "group relative w-full text-left rounded-2xl p-5 transition-all duration-200",
        "glass-surface glass-surface-hover",
        isSelected && "gradient-border shadow-glow",
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
              isSelected
                ? "bg-primary/20 text-primary"
                : "bg-white/[0.06] text-muted-foreground",
            )}
          >
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "text-sm font-semibold truncate",
                isSelected && "text-primary",
              )}
            >
              {name}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-1.5 mt-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 font-medium">
            <span>Günlük Doluluk</span>
            <span
              className={cn(
                occupancy > 60 ? "text-amber-400" : "text-emerald-400",
              )}
            >
              {occupancy}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary/40 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                occupancy > 60 ? "bg-amber-500" : "bg-primary",
              )}
              style={{ width: `${occupancy}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
