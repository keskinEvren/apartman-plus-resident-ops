import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Settings, Shield } from "lucide-react";

interface MembershipDetailsProps {
  currentMembership: {
    site?: { name: string } | null;
    role?: { name: string } | null;
    blockId?: string | null;
    unitId?: string | null;
  };
}

export function MembershipDetails({
  currentMembership,
}: MembershipDetailsProps) {
  return (
    <GlassCard className="gradient-border space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Settings className="h-4 w-4 text-primary" />
        Üyelik Detayları
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
        <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Aktif Site
          </span>
          <p className="font-bold text-sm text-foreground">
            {currentMembership.site?.name}
          </p>
        </div>
        <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Sistem Rolü
          </span>
          <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary" />
            {currentMembership.role?.name}
          </p>
        </div>
        <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Blok / Kısım Mape
          </span>
          <p className="font-bold text-sm text-foreground">
            {currentMembership.blockId
              ? "A Blok (Sınırlandırılmış SLA)"
              : "Tüm Bloklar"}
          </p>
        </div>
        <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            Daire Numarası
          </span>
          <p className="font-bold text-sm text-foreground">
            {currentMembership.unitId
              ? "Daire A-1"
              : "Görevli (Daire Eşleşmesi Yok)"}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
