"use client";

import React from "react";

const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

interface DayTabsProps {
  selectedDay: number;
  onSelect: (day: number) => void;
}

export function DayTabs({ selectedDay, onSelect }: DayTabsProps) {
  return (
    <div className="flex gap-1.5 mb-4 overflow-x-auto">
      {DAY_LABELS.map((label, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedDay === idx
              ? "bg-primary/15 text-primary shadow-glow"
              : "glass-surface text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
