"use client";

import React from "react";
import { trpc } from "@/lib/trpc";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTimeline } from "@/components/dashboard/DashboardTimeline";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export function DashboardClient() {
  const { data: reservations = [], isLoading: loadRes } =
    trpc.amenity.listMyReservations.useQuery();
  const { data: notifications = [], isLoading: loadNot } =
    trpc.notification.listMyNotifications.useQuery();
  const { data: visitors = [], isLoading: loadVis } =
    trpc.visitor.listExpectedVisitors.useQuery({});
  const { data: packages = [], isLoading: loadPkg } =
    trpc.package.listMyPackages.useQuery();
  const { data: tickets = [], isLoading: loadTkt } =
    trpc.ticket.listMyTickets.useQuery();

  const activeRes = reservations.filter((r) => r.status === "CONFIRMED");
  const pendingPkgs = packages.filter((p) => p.status === "RECEIVED");
  const openTkts = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
  );

  const loading = loadRes || loadNot || loadVis || loadPkg || loadTkt;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Ana Sayfa
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Apartman Plus Resident Ops — günlük operasyonel genel bakış
        </p>
      </div>

      {/* Stats Mini Panel */}
      <DashboardStats
        pendingPkgsCount={pendingPkgs.length}
        openTktsCount={openTkts.length}
        activeResCount={activeRes.length}
        visitorsCount={visitors.length}
        loading={loading}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <DashboardTimeline notifications={notifications} loading={loading} />
        <DashboardSidebar
          pendingPkgs={pendingPkgs}
          openTkts={openTkts}
          activeRes={activeRes}
        />
      </div>
    </div>
  );
}
