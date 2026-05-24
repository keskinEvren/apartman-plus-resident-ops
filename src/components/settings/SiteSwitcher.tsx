import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Building, MapPin, Check } from "lucide-react";

interface SiteSwitcherProps {
  mySites: any[];
  activeSiteId: string | null;
  onSiteSwitch: (siteId: string, siteName: string) => void;
}

export function SiteSwitcher({ mySites, activeSiteId, onSiteSwitch }: SiteSwitcherProps) {
  return (
    <GlassCard className="gradient-border space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Building className="h-4 w-4 text-primary" />
        Aktif Site Değiştirici (Site Switcher)
      </h2>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Hesabınız birden fazla sitede kayıtlıysa, aşağıdan hızlıca siteler
        arasında geçiş yapabilirsiniz. Tüm veriler seçtiğiniz siteye göre
        izole edilecektir.
      </p>

      <div className="space-y-2 pt-2">
        {mySites.map((ms) => {
          const isSelected = ms.site?.id === activeSiteId;
          return (
            <div
              key={ms.site?.id}
              onClick={() => onSiteSwitch(ms.site!.id, ms.site!.name)}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "bg-primary/10 border-primary text-primary shadow-glow"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  {ms.site?.name}
                </p>
                <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {ms.site?.address}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06] font-medium text-foreground">
                  {ms.role?.name === "SITE_ADMIN"
                    ? "Yönetici"
                    : ms.role?.name === "STAFF"
                      ? "Görevli"
                      : "Kat Sakini"}
                </span>
                {isSelected && (
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
