"use client";

import React from "react";
import { Package, AlertCircle, Clock, ArrowRight } from "lucide-react";

interface DashboardSidebarProps {
  pendingPkgs: any[];
  openTkts: any[];
  activeRes: any[];
}

export function DashboardSidebar({
  pendingPkgs,
  openTkts,
  activeRes,
}: DashboardSidebarProps) {
  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Pending Actions */}
      <div className="p-5 rounded bg-card border border-border space-y-3">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/40 pb-2.5">
          Bekleyen İşlemler
        </h3>
        <div className="space-y-2">
          {pendingPkgs.length === 0 && openTkts.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              İşlem bekleyen bir kayıt bulunmuyor.
            </p>
          )}
          {pendingPkgs.map((p) => (
            <div
              key={p.id}
              className="p-2.5 rounded border border-border bg-secondary/20 flex items-start gap-3"
            >
              <Package className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">
                  Kargo Teslimatı Bekliyor
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {p.carrierName} ile gelen paket.
                </p>
                <span className="inline-block mt-1 text-[9px] font-mono bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-bold">
                  OTP: {p.otpCode}
                </span>
              </div>
            </div>
          ))}
          {openTkts.map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded border border-border bg-secondary/20 flex items-start gap-3"
            >
              <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">
                  Açık Destek Talebi
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {t.title}
                </p>
                <span className="inline-block mt-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                  {t.status === "OPEN" ? "Açık" : "İşlemde"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Reservations */}
      <div className="p-5 rounded bg-card border border-border space-y-3">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/40 pb-2.5">
          Yaklaşan Rezervasyonlar
        </h3>
        <div className="space-y-2">
          {activeRes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Planlanmış yakın bir rezervasyon bulunmuyor.
            </p>
          ) : (
            activeRes.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="p-2.5 rounded border border-border bg-secondary/20 flex items-start gap-2.5 justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {(r as any).amenity?.name || "Tesis Seansı"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 shrink-0" />
                    {new Date(r.reservationDate).toLocaleDateString(
                      "tr-TR",
                    )} | {(r as any).slot?.startTime} -{" "}
                    {(r as any).slot?.endTime}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
