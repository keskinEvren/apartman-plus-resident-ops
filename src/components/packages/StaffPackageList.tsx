"use client";

import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  Package,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface StaffPackageListProps {
  packages: any[];
  onDeliverClick: (id: string) => void;
}

export function StaffPackageList({
  packages,
  onDeliverClick,
}: StaffPackageListProps) {
  if (packages.length === 0) {
    return (
      <GlassCard className="text-center py-12">
        <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">
          Kayıtlı kargo bulunamadı
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Rezidans kargo akışınız şu an temiz.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {packages.map((pack) => (
        <GlassCard
          key={pack.id}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                pack.status === "RECEIVED"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-sm">
                  {pack.carrierName}
                </span>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-lg border border-border text-foreground font-medium">
                  {pack.blockName} - {pack.unitNumber}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    pack.status === "RECEIVED"
                      ? "bg-amber-50 border-amber-200 text-amber-600"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                  }`}
                >
                  {pack.status === "RECEIVED"
                    ? "Teslim Edilmedi"
                    : "Teslim Edildi"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Giriş: {new Date(pack.receivedAt).toLocaleString("tr-TR")}
                </span>
                {pack.deliveredAt && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Teslim: {new Date(pack.deliveredAt).toLocaleString("tr-TR")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {pack.status === "RECEIVED" ? (
            <button
              onClick={() => onDeliverClick(pack.id)}
              className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              OTP ile Teslim Et
            </button>
          ) : (
            <span className="text-xs text-emerald-600/80 font-medium flex items-center gap-1 mr-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Teslim Edildi
            </span>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
