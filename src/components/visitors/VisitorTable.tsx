"use client";

import React from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { GlassCard } from "@/components/shared/GlassCard";
import { UserPlus, LogIn } from "lucide-react";

interface VisitorPass {
  id: string;
  visitorName: string;
  visitDate: string;
  expectedTime?: string | null;
  status: string;
  createdAt: string | Date;
  checkedInAt?: string | Date | null;
}

interface VisitorTableProps {
  passes: VisitorPass[];
  onCheckIn?: (id: string) => void;
  isCheckingIn?: boolean;
  showCheckIn?: boolean;
}

export function VisitorTable({
  passes,
  onCheckIn,
  isCheckingIn,
  showCheckIn,
}: VisitorTableProps) {
  if (passes.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <UserPlus className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Henüz ziyaretçi kaydı bulunmuyor
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ziyaretçi
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Saat
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Durum
              </th>
              {showCheckIn && (
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  İşlem
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {passes.map((p) => (
              <tr key={p.id} className="hover:bg-muted transition">
                <td className="px-5 py-3.5 text-sm font-medium">
                  {p.visitorName}
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {p.visitDate}
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {p.expectedTime || "—"}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={p.status} />
                </td>
                {showCheckIn && (
                  <td className="px-5 py-3.5 text-right">
                    {p.status === "EXPECTED" && onCheckIn && (
                      <button
                        onClick={() => onCheckIn(p.id)}
                        disabled={isCheckingIn}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-teal-600 hover:bg-teal-50 transition disabled:opacity-50"
                      >
                        <LogIn className="h-3 w-3" />
                        Giriş Yap
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
