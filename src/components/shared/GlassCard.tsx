"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border border-[hsl(280,10%,90%)] p-5 shadow-card",
        hover && "hover:shadow-subtle hover:border-[hsl(280,10%,85%)] cursor-pointer transition-shadow",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}
