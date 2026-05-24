"use client";

import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Truck, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface ResidentPackageListProps {
  packages: any[];
}

export function ResidentPackageList({ packages }: ResidentPackageListProps) {
  if (packages.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Kayıtlı kargo bulunamadı</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Rezidans kargo akışınız şu an temiz.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {packages.map((pack) => (
        <GlassCard key={pack.id} className="gradient-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
              pack.status === "RECEIVED" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
            }`}>
              <Truck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{pack.carrierName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  pack.status === "RECEIVED" 
                    ? "bg-amber-500/15 border-amber-500/20 text-amber-400"
                    : "bg-emerald-500/15 border-emerald-500/20 text-emerald-400"
                }`}>
                  {pack.status === "RECEIVED" ? "Güvenlikte Bekliyor" : "Teslim Edildi"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Geliş: {new Date(pack.receivedAt).toLocaleString("tr-TR")}
                </span>
                {pack.deliveredAt && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Teslim: {new Date(pack.deliveredAt).toLocaleString("tr-TR")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {pack.status === "RECEIVED" && (
            <div className="w-full md:w-auto p-4 bg-primary/5 border border-primary/20 rounded-xl flex flex-col items-center justify-center text-center font-heading">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">TESLİMAT KODUNUZ</span>
              <span className="text-2xl font-mono font-bold text-primary tracking-widest mt-1">{pack.otpCode}</span>
              <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">
                Kargonuzu alırken bu kodu güvenliğe söyleyin.
              </p>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
