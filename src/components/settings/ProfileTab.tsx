"use client";

import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { User, Phone, ShieldAlert, Save } from "lucide-react";

export function ProfileTab() {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.user.me.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      showToast("success", "Profil bilgileriniz başarıyla güncellendi!");
      utils.user.me.invalidate();
    },
    onError: (err) =>
      showToast("error", err.message || "Profil güncellenemedi"),
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    eName: "",
    ePhone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        phone: profile.phoneNumber || "",
        eName: profile.emergencyContactName || "",
        ePhone: profile.emergencyContactPhone || "",
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim()) {
      updateProfile.mutate({
        name: form.name,
        phoneNumber: form.phone,
        emergencyContactName: form.eName,
        emergencyContactPhone: form.ePhone,
      });
    }
  };

  if (isLoading) return <LoadingSpinner size="lg" />;
  const initials = form.name
    ? form.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in text-sm">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        <div className="md:col-span-4 space-y-6">
          <GlassCard className="gradient-border p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 font-heading text-2xl font-bold text-white shadow-glow">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-base">{form.name || "Sakin"}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.email}
              </p>
              <span className="inline-block mt-2 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                {profile?.role === "admin" ? "Yönetici" : "Katılımcı Sakin"}
              </span>
            </div>
          </GlassCard>
        </div>

        <div className="md:col-span-8 space-y-6">
          <GlassCard className="gradient-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Kişisel Bilgiler
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Ad Soyad
                </label>
                <input
                  id="profile-name-input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Telefon
                </label>
                <input
                  id="profile-phone-input"
                  placeholder="5xx xxx xx xx"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="gradient-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Acil Durum
              Kontağı
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Kişi Adı
                </label>
                <input
                  id="profile-emergency-name"
                  placeholder="Kişi Adı Soyadı"
                  value={form.eName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, eName: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Yakın Telefonu
                </label>
                <input
                  id="profile-emergency-phone"
                  placeholder="Kontak Telefonu"
                  value={form.ePhone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, ePhone: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-end">
            <button
              id="profile-submit-btn"
              type="submit"
              disabled={updateProfile.isPending}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-glow"
            >
              {updateProfile.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Profili Kaydet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
