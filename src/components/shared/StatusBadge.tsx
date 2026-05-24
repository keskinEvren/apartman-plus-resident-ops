"use client";

import React from "react";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "confirmed"
  | "cancelled"
  | "expected"
  | "checked_in"
  | "info";

const variantStyles: Record<StatusVariant, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  expected: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  checked_in: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const variantLabels: Record<string, { variant: StatusVariant; label: string }> =
  {
    CONFIRMED: { variant: "confirmed", label: "Onaylandı" },
    CANCELLED: { variant: "cancelled", label: "İptal" },
    EXPECTED: { variant: "expected", label: "Bekleniyor" },
    CHECKED_IN: { variant: "checked_in", label: "Giriş Yapıldı" },
  };

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const mapped = variantLabels[status] || {
    variant: "info" as StatusVariant,
    label: status,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variantStyles[mapped.variant],
        className,
      )}
    >
      {mapped.label}
    </span>
  );
}
