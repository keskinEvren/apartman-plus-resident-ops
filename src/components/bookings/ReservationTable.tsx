"use client";

import React from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { GlassCard } from "@/components/shared/GlassCard";
import { CalendarDays, X } from "lucide-react";

interface Reservation {
  id: string;
  reservationDate: string;
  status: string;
  createdAt: string | Date;
  session: { startTime: string; endTime: string } | null;
  amenity: { name: string } | null;
}

interface ReservationTableProps {
  reservations: Reservation[];
  onCancel: (id: string) => void;
  isCancelling?: boolean;
}

export function ReservationTable({
  reservations,
  onCancel,
  isCancelling,
}: ReservationTableProps) {
  if (reservations.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Henüz rezervasyonunuz bulunmuyor
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tesis
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Seans
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Durum
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {reservations.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3.5 text-sm font-medium">
                  {r.amenity?.name || "—"}
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {r.reservationDate}
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                  {r.session
                    ? `${r.session.startTime} – ${r.session.endTime}`
                    : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  {r.status === "CONFIRMED" && (
                    <button
                      onClick={() => onCancel(r.id)}
                      disabled={isCancelling}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      İptal
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
