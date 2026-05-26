"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Terminal } from "lucide-react";
import { showToast } from "@/components/shared/Toast";
import { getNavSections } from "./SidebarData";

export function Sidebar({
  className,
  isMobileOpen = false,
  onClose,
}: {
  className?: string;
  isMobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get("tab");

  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [activeMembershipId, setActiveMembershipId] = useState<string | null>(
    null,
  );
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveSiteId(localStorage.getItem("active-site-id"));
      setActiveMembershipId(localStorage.getItem("active-membership-id"));
      setIsDevMode(localStorage.getItem("developer-mode") === "true");
    }
  }, []);

  const { data: mySites = [] } = trpc.site.getMySites.useQuery();
  const currentMembership = activeMembershipId
    ? mySites?.find((s) => s.membershipId === activeMembershipId)
    : mySites?.find((s) => s.site?.id === activeSiteId);
  const isAdmin =
    currentMembership?.role?.name === "SITE_ADMIN" ||
    currentMembership?.role?.name === "SUPER_ADMIN";

  const handleDevModeToggle = () => {
    const nextVal = !isDevMode;
    setIsDevMode(nextVal);
    localStorage.setItem("developer-mode", nextVal ? "true" : "false");
    showToast(
      nextVal ? "success" : "info",
      nextVal ? "Geliştirici Modu Aktif" : "Geliştirici Modu Kapatıldı",
    );
    window.location.reload();
  };

  const navSections = getNavSections(!!isAdmin);

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-64 bg-card/95 lg:bg-card/60 backdrop-blur-md border-r border-border flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        className,
      )}
    >
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isTab = (item as any).isTab;
                const isActive = isTab
                  ? pathname === "/dashboard/settings" &&
                    activeTabParam === isTab
                  : pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors relative",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4 bg-secondary/20">
        <button
          onClick={handleDevModeToggle}
          className={cn(
            "w-full flex items-center justify-between p-2 rounded-md border text-xs font-semibold transition-colors",
            isDevMode
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          )}
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5" />
            <span>Developer Mode</span>
          </div>
          <div
            className={cn(
              "w-6 h-3.5 rounded-full p-0.5 transition-colors duration-200",
              isDevMode ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200",
                isDevMode ? "translate-x-2.5" : "translate-x-0",
              )}
            />
          </div>
        </button>
      </div>
    </aside>
  );
}
