"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bell, ChevronDown, Check, Building, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";

interface HeaderProps {
  className?: string;
  unreadCount?: number;
  onNotificationClick?: () => void;
}

export function Header({
  className,
  unreadCount = 0,
  onNotificationClick,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [activeMembershipId, setActiveMembershipId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveSiteId(localStorage.getItem("active-site-id"));
      setActiveMembershipId(localStorage.getItem("active-membership-id"));
    }
  }, []);

  const { data: mySites = [] } = trpc.site.getMySites.useQuery();

  const currentMembership = activeMembershipId
    ? mySites?.find((s) => s.membershipId === activeMembershipId)
    : mySites?.find((s) => s.site?.id === activeSiteId);

  const handleSiteSwitch = (
    siteId: string,
    siteName: string,
    membershipId: string,
  ) => {
    localStorage.setItem("active-site-id", siteId);
    localStorage.setItem("active-membership-id", membershipId);
    showToast("success", `"${siteName}" sitesine başarıyla geçiş yapıldı.`);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full h-14 bg-card/60 backdrop-blur-md border-b border-border flex items-center justify-between px-6 shadow-sm",
        className,
      )}
    >
      {/* Brand logo & Property Switcher */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-[11px] font-bold">
            A+
          </div>
          <span className="font-heading text-base font-bold text-foreground hover:opacity-90 transition-opacity">
            Apartman Plus
          </span>
        </Link>

        {mySites.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <Building className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{currentMembership?.site?.name || "Mülk Seçin"}</span>
              {currentMembership?.unit && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  (
                  {currentMembership.unit.blockName
                    ? `${currentMembership.unit.blockName} `
                    : ""}
                  D.{currentMembership.unit.unitNumber})
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-64 rounded-lg bg-card border border-border p-1 shadow-lg z-50 animate-fade-in">
                  <div className="px-2.5 py-1.5 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40">
                    Kayıtlı Mülkleriniz
                  </div>
                  <div className="space-y-0.5 max-h-60 overflow-y-auto">
                    {mySites.map((ms) => {
                      const isSelected = activeMembershipId
                        ? ms.membershipId === activeMembershipId
                        : ms.site?.id === activeSiteId;

                      return (
                        <button
                          key={ms.membershipId}
                          onClick={() =>
                            handleSiteSwitch(
                              ms.site!.id,
                              ms.site!.name,
                              ms.membershipId,
                            )
                          }
                          className={cn(
                            "w-full text-left p-2 rounded-md flex items-center justify-between text-xs transition-colors",
                            isSelected
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate text-foreground font-medium">
                              {ms.site?.name}
                            </p>
                            {ms.unit ? (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {ms.unit.blockName
                                  ? `${ms.unit.blockName} `
                                  : ""}
                                Daire {ms.unit.unitNumber}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground truncate">
                                Genel Yetki
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNotificationClick}
          className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Bildirimler"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
