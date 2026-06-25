"use client";

import React from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Laptop, Smartphone, Power, Globe } from "lucide-react";

export function SessionManagerCard() {
  const utils = trpc.useUtils();
  const { data: sessions = [], isLoading } =
    trpc.security.listActiveSessions.useQuery();

  const revokeMutation = trpc.security.revokeSession.useMutation({
    onSuccess: () => {
      showToast("success", "Oturum başarıyla sonlandırıldı.");
      utils.security.listActiveSessions.invalidate();
    },
    onError: (err) =>
      showToast("error", err.message || "Oturum sonlandırılamadı"),
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isMobile = (ua: string) => {
    const lower = ua.toLowerCase();
    return (
      lower.includes("android") ||
      lower.includes("iphone") ||
      lower.includes("ipad")
    );
  };

  const parseUA = (ua: string) => {
    const lower = ua.toLowerCase();
    let browser = "Tarayıcı";
    let os = "Cihaz";

    if (lower.includes("chrome")) browser = "Chrome";
    else if (lower.includes("safari")) browser = "Safari";
    else if (lower.includes("firefox")) browser = "Firefox";
    else if (lower.includes("edge")) browser = "Edge";

    if (lower.includes("android")) os = "Android";
    else if (lower.includes("iphone") || lower.includes("ipad")) os = "iOS";
    else if (lower.includes("macintosh") || lower.includes("mac os"))
      os = "macOS";
    else if (lower.includes("windows")) os = "Windows";
    else if (lower.includes("linux")) os = "Linux";

    return `${os} • ${browser}`;
  };

  if (isLoading) return <LoadingSpinner size="sm" />;

  return (
    <GlassCard className="p-5 space-y-4 col-span-full">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Laptop className="h-4.5 w-4.5 text-primary" /> Aktif Oturumlar ve
        Cihazlar
      </h3>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-xs">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`p-3 bg-secondary border border-border rounded-xl flex items-center justify-between gap-4 transition-all hover:bg-secondary ${
              s.isCurrent ? "border-primary/20 bg-primary/[0.01]" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  s.isCurrent
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {isMobile(s.userAgent) ? (
                  <Smartphone className="h-4.5 w-4.5" />
                ) : (
                  <Laptop className="h-4.5 w-4.5" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p
                    className="font-bold text-foreground truncate max-w-[120px] sm:max-w-xs"
                    title={s.userAgent}
                  >
                    {parseUA(s.userAgent)}
                  </p>
                  {s.isCurrent && (
                    <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      Bu Cihaz
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" /> {s.ipAddress}
                  </span>
                  <span className="hidden sm:inline">
                    Son Etkinlik: {formatDate(s.lastActiveAt)}
                  </span>
                </div>
              </div>
            </div>

            {!s.isCurrent && (
              <button
                onClick={() => revokeMutation.mutate({ sessionId: s.id })}
                disabled={revokeMutation.isPending}
                className="px-2.5 py-1.5 bg-red-50 border border-red-500/20 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1 shrink-0"
              >
                <Power className="h-3 w-3" /> Oturumu Kapat
              </button>
            )}
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-[11px] text-muted-foreground/60 italic py-6 text-center">
            Aktif oturum bulunamadı.
          </p>
        )}
      </div>
    </GlassCard>
  );
}
