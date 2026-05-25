"use client";

import React from "react";
import { trpc } from "@/lib/trpc";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { ResidentPreferenceMatrix } from "./ResidentPreferenceMatrix";
import { User, Phone, ShieldAlert, Heart, Bell, X } from "lucide-react";

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
    },
    {
      label: "Acil Kontak Kişi",
      value: profile.emergencyContactName || "Girilmemiş",
      icon: User,
    },
    {
      label: "Acil Kontak Telefon",
      value: profile.emergencyContactPhone || "Girilmemiş",
      icon: ShieldAlert,
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
          {/* Details */}
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
                      <span className="font-bold text-xs">{d.value}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Pets */}
          <div className="md:col-span-7">
            <GlassCard className="bg-white/[0.01] border border-white/[0.06] p-4 space-y-4 h-full flex flex-col justify-start">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-white/[0.04] pb-2">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />{" "}
                Sakinin Evcil Hayvanları ({pets.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[220px] pr-1">
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-foreground">
                        🐾 {pet.name}
                      </p>
                      <p className="text-[9px] text-primary/80 font-semibold mt-0.5">
                        {pet.species} {pet.breed ? `(${pet.breed})` : ""}
                      </p>
                      {pet.notes && (
                        <p className="text-[9px] text-muted-foreground mt-1.5 bg-black/15 p-1.5 rounded italic">
                          &ldquo;{pet.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <p className="text-[8px] text-muted-foreground mt-2 border-t border-white/[0.04] pt-2">
                      {pet.vaccineStatus}
                    </p>
                  </div>
                ))}
                {pets.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/60 italic py-8 text-center col-span-full">
                    Kayıtlı evcil hayvanı bulunmuyor.
                  </p>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Preferences Matrix */}
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
