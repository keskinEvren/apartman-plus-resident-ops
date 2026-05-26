"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTimeline } from "@/components/dashboard/DashboardTimeline";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { RotateCw } from "lucide-react";
import { showToast } from "@/components/shared/Toast";

export function DashboardClient() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: reservations = [],
    isLoading: loadRes,
    refetch: refetchRes,
  } = trpc.amenity.listMyReservations.useQuery();
  const {
    data: notifications = [],
    isLoading: loadNot,
    refetch: refetchNot,
  } = trpc.notification.listMyNotifications.useQuery();
  const {
    data: visitors = [],
    isLoading: loadVis,
    refetch: refetchVis,
  } = trpc.visitor.listExpectedVisitors.useQuery({});
  const {
    data: packages = [],
    isLoading: loadPkg,
    refetch: refetchPkg,
  } = trpc.package.listMyPackages.useQuery();
  const {
    data: tickets = [],
    isLoading: loadTkt,
    refetch: refetchTkt,
  } = trpc.ticket.listMyTickets.useQuery();

  const activeRes = reservations.filter((r) => r.status === "CONFIRMED");
  const pendingPkgs = packages.filter((p) => p.status === "RECEIVED");
  const openTkts = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
  );

  const loading = loadRes || loadNot || loadVis || loadPkg || loadTkt;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchRes(),
        refetchNot(),
        refetchVis(),
        refetchPkg(),
        refetchTkt(),
      ]);
      showToast("success", "Veriler başarıyla güncellendi.");
    } catch {
      showToast("error", "Güncelleme sırasında hata oluştu.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            Ana Sayfa
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Apartman Plus Resident Ops — günlük operasyonel genel bakış
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 disabled:opacity-50"
          aria-label="Yenile"
        >
          <RotateCw
            className={cn(
              "h-3.5 w-3.5",
              isRefreshing && "animate-spin text-primary",
            )}
          />
          <span className="hidden sm:inline">Yenile</span>
        </button>
      </div>

      {/* Stats Mini Panel */}
      <DashboardStats
        pendingPkgsCount={pendingPkgs.length}
        openTktsCount={openTkts.length}
        activeResCount={activeRes.length}
        visitorsCount={visitors.length}
        loading={loading || isRefreshing}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <DashboardTimeline
          notifications={notifications}
          loading={loading || isRefreshing}
        />
        <DashboardSidebar
          pendingPkgs={pendingPkgs}
          openTkts={openTkts}
          activeRes={activeRes}
        />
      </div>
    </div>
  );
}
