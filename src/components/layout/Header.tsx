"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bell, ChevronDown, Check, Building, Menu, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
interface HeaderProps {
  className?: string;
  unreadCount?: number;
  onNotificationClick?: () => void;
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}
export function Header({
  className,
  unreadCount = 0,
  onNotificationClick,
  onMenuClick,
  isMenuOpen = false,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [activeMembershipId, setActiveMembershipId] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    setActiveSiteId(localStorage.getItem("active-site-id"));
    setActiveMembershipId(localStorage.getItem("active-membership-id"));
  }, []);
  const { data: mySites = [] } = trpc.site.getMySites.useQuery();
  const currentMembership = mySites?.find((s) =>
    activeMembershipId
      ? s.membershipId === activeMembershipId
      : s.site?.id === activeSiteId,
  );
  const handleSiteSwitch = (siteId: string, name: string, mId: string) => {
    localStorage.setItem("active-site-id", siteId);
    localStorage.setItem("active-membership-id", mId);
    showToast("success", `"${name}" sitesine başarıyla geçiş yapıldı.`);
    setIsOpen(false);
    window.location.reload();
  };
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full h-14 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 shadow-sm",
        className,
      )}
    >
      {/* Brand logo & Property Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex lg:hidden p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors shrink-0"
            aria-label="Menüyü aç"
          >
            {isMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <img
            src="/komsu.jpeg"
            alt="komşu"
            className="h-6 w-6 rounded object-cover shrink-0"
          />
          <span className="font-heading text-sm sm:text-base font-bold text-foreground hover:opacity-90 transition-opacity hidden xs:inline-block">
            komşu<span className="text-primary font-medium">.site</span>
          </span>
        </Link>

        {mySites.length > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md bg-secondary/50 border border-border text-[11px] sm:text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-[150px]">
                {currentMembership?.site?.name || "Mülk Seçin"}
              </span>
              {currentMembership?.unit && (
                <span className="hidden md:inline text-[10px] text-muted-foreground font-normal">
                  (
                  {currentMembership.unit.blockName
                    ? `${currentMembership.unit.blockName} `
                    : ""}
                  D.{currentMembership.unit.unitNumber})
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-64 rounded-lg bg-white border border-border p-1 shadow-lg z-50 animate-fade-in">
                  <div className="px-2.5 py-1.5 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/40">
                    Kayıtlı Mülkleriniz
                  </div>
                  <div className="space-y-0.5 max-h-60 overflow-y-auto">
                    {mySites.map((ms) => {
                      const isSelected = activeMembershipId
                        ? ms.membershipId === activeMembershipId
                        : ms.site?.id === activeSiteId;
                      const switchSite = () =>
                        handleSiteSwitch(
                          ms.site!.id,
                          ms.site!.name,
                          ms.membershipId,
                        );
                      return (
                        <button
                          key={ms.membershipId}
                          onClick={switchSite}
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
                            <p className="text-[10px] text-muted-foreground truncate">
                              {ms.unit
                                ? `${ms.unit.blockName ? `${ms.unit.blockName} ` : ""}Daire ${ms.unit.unitNumber}`
                                : "Genel Yetki"}
                            </p>
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
