"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";

export function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="glass-input w-full rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Yeni Şifre
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="glass-input w-full rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Yeni Şifre (Tekrar)
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="glass-input w-full rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
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
