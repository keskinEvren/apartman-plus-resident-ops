"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-surface rounded-2xl p-5",
        hover && "glass-surface-hover cursor-pointer",
        glow && "shadow-glow",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
