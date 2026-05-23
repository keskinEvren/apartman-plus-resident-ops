"use client";

import React from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CalendarDays, Bell, UserPlus, ArrowRight } from "lucide-react";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  href: string;
  gradient: string;
  isLoading: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  gradient,
  isLoading,
}: StatCardProps) {
  return (
    <Link href={href}>
      <GlassCard hover className="group gradient-border">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${gradient}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </div>
        <div className="mt-4">
          {isLoading ? (
            <LoadingSpinner size="sm" className="justify-start" />
          ) : (
            <p className="text-3xl font-bold font-heading">{value ?? 0}</p>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        </div>
      </GlassCard>
    </Link>
  );
}

export function DashboardClient() {
  const { data: reservations, isLoading: loadingRes } =
    trpc.booking.listMyReservations.useQuery();
  const { data: notifications, isLoading: loadingNot } =
    trpc.notification.listMyNotifications.useQuery();
  const { data: visitors, isLoading: loadingVis } =
    trpc.visitor.listExpectedVisitors.useQuery({});

  const activeReservations = reservations?.filter(
    (r) => r.status === "CONFIRMED",
  ).length;
  const unreadNotifications = notifications?.filter((n) => !n.isRead).length;
  const expectedVisitors = visitors?.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Apartman Plus Resident Ops — genel bakış
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Aktif Rezervasyonlar"
          value={activeReservations}
          href="/dashboard/bookings"
          gradient="bg-gradient-to-br from-primary/80 to-purple-700"
          isLoading={loadingRes}
        />
        <StatCard
          icon={Bell}
          label="Okunmamış Bildirimler"
          value={unreadNotifications}
          href="/dashboard"
          gradient="bg-gradient-to-br from-amber-500/80 to-orange-600"
          isLoading={loadingNot}
        />
        <StatCard
          icon={UserPlus}
          label="Bugün Beklenen Ziyaretçiler"
          value={expectedVisitors}
          href="/dashboard/visitors"
          gradient="bg-gradient-to-br from-accent/80 to-teal-600"
          isLoading={loadingVis}
        />
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/dashboard/bookings">
            <GlassCard hover className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Yeni Rezervasyon</p>
                <p className="text-xs text-muted-foreground">
                  Tesis seansı ayırtın
                </p>
              </div>
            </GlassCard>
          </Link>
          <Link href="/dashboard/visitors">
            <GlassCard hover className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ziyaretçi Kaydı</p>
                <p className="text-xs text-muted-foreground">
                  Ön kayıt oluşturun
                </p>
              </div>
            </GlassCard>
          </Link>
        </div>
      </section>
    </div>
  );
}
