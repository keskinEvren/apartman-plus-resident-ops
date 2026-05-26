"use client";

import React from "react";
import { trpc } from "@/lib/trpc";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { ResidentPreferenceMatrix } from "./ResidentPreferenceMatrix";
import { ResidentPetsSection } from "./ResidentPetsSection";
import { User, Phone, ShieldAlert, Bell, X } from "lucide-react";

interface ResidentProfileModalProps {
  siteId: string;
  residentUserId: string;
  onClose: () => void;
}

export function ResidentProfileModal({
  siteId,
  residentUserId,
  onClose,
}: ResidentProfileModalProps) {
  const { data, isLoading } = trpc.user.getResidentProfileForAdmin.useQuery({
    siteId,
    residentUserId,
  });

  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <GlassCard className="p-8 max-w-sm w-full gradient-border flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-muted-foreground mt-4">Yükleniyor...</p>
        </GlassCard>
      </div>
    );
  }

  const { profile, pets, preferences } = data;
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const details = [
    {
      label: "Telefon",
      value: profile.phoneNumber || "Girilmemiş",
      icon: Phone,
      isPhone: !!profile.phoneNumber,
    },
    {
      label: "Acil Kontak Kişi",
      value: profile.emergencyContactName || "Girilmemiş",
      icon: User,
      isPhone: false,
    },
    {
      label: "Acil Kontak Telefon",
      value: profile.emergencyContactPhone || "Girilmemiş",
      icon: ShieldAlert,
      isPhone: !!profile.emergencyContactPhone,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <GlassCard className="w-full max-w-4xl gradient-border p-6 space-y-6 relative animate-fade-in text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 font-heading text-lg font-bold text-white shadow-glow">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                {profile.name}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.08] text-muted-foreground hover:text-foreground rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-4">
            <GlassCard className="bg-white/[0.01] border border-white/[0.06] p-4 space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" /> İletişim & Kontak
                Bilgileri
              </h4>
              <div className="space-y-3">
                {details.map((d, idx) => {
                  const Icon = d.icon;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center border-b border-white/[0.02] pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Icon className="h-3.5 w-3.5" /> {d.label}
                      </span>
                      {d.isPhone && d.value !== "Girilmemiş" ? (
                        <a
                          href={`tel:${d.value}`}
                          className="font-bold text-xs text-primary hover:text-primary/80 hover:underline transition-all"
                        >
                          {d.value}
                        </a>
                      ) : (
                        <span className="font-bold text-xs">{d.value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          <div className="md:col-span-7">
            <ResidentPetsSection pets={pets} />
          </div>
        </div>

        <GlassCard className="bg-white/[0.01] border border-white/[0.06] p-4 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-white/[0.04] pb-2">
            <Bell className="h-4 w-4 text-primary" /> Bildirim Tercih Matrisi
            (Salt Okunur)
          </h4>
          <ResidentPreferenceMatrix preferences={preferences} />
        </GlassCard>
      </GlassCard>
    </div>
  );
}
