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
  confirmed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  expected: "bg-amber-50 text-amber-600 border-amber-200",
  checked_in: "bg-teal-50 text-teal-600 border-teal-200",
  info: "bg-blue-50 text-blue-600 border-blue-200",
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
