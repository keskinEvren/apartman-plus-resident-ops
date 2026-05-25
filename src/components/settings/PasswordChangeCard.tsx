"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { KeyRound, CheckCircle2 } from "lucide-react";

export function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changeMutation = trpc.security.changePassword.useMutation({
    onSuccess: () => {
      showToast("success", "Şifreniz başarıyla güncellendi!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => showToast("error", err.message || "Şifre güncellenemedi"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("error", "Yeni şifreler eşleşmiyor");
      return;
    }
    changeMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <GlassCard className="gradient-border p-5 space-y-4">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <KeyRound className="h-4.5 w-4.5 text-primary" />
        Şifre Değiştir
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Mevcut Şifre
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Yeni Şifre
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Yeni Şifre (Tekrar)
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          type="submit"
          disabled={changeMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-bold transition-all shadow-glow flex items-center justify-center gap-1.5 mt-2"
        >
          {changeMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Şifreyi Güncelle
            </>
          )}
        </button>
      </form>
    </GlassCard>
  );
}
