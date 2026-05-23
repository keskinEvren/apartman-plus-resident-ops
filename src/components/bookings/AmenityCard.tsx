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

export function AmenityCard({ id, name, description, isSelected, onSelect }: AmenityCardProps) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        "group relative w-full text-left rounded-2xl p-5 transition-all duration-200",
        "glass-surface glass-surface-hover",
        isSelected && "gradient-border shadow-glow",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            isSelected ? "bg-primary/20 text-primary" : "bg-white/[0.06] text-muted-foreground",
          )}
        >
          <Dumbbell className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className={cn("text-sm font-semibold", isSelected && "text-primary")}>
            {name}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}
