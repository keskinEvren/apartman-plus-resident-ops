"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface LoginFormMfaSectionProps {
  tempToken: string;
  onSuccess: (data: { token: string; user: any; memberships: any[] }) => void;
  onBack: () => void;
}

export function LoginFormMfaSection({
  tempToken,
  onSuccess,
  onBack,
}: LoginFormMfaSectionProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const verifyMfaMutation = trpc.auth.verifyMfa.useMutation({
    onSuccess: (data) => onSuccess(data),
    onError: (err) => {
      setError(err.message || "Girdiğiniz 2FA kodu geçersiz.");
      showToast("error", err.message || "Kod doğrulanamadı");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      setError("Doğrulama kodu 6 haneli olmalıdır.");
      return;
    }
    verifyMfaMutation.mutate({ tempToken, code });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in text-xs">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl leading-relaxed font-semibold">
          {error}
        </div>
      )}
      <div className="space-y-3">
        <div className="space-y-1.5 text-center">
          <label className="text-xs font-semibold text-muted-foreground flex justify-center gap-1.5 items-center">
            <ShieldAlert className="h-4 w-4 text-primary" /> Doğrulama Kodu
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="glass-input w-full rounded-xl px-3 py-2.5 text-base font-bold text-center tracking-[0.3em] focus:outline-none"
            required
          />
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-[10px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 mx-auto transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Geri Dön
        </button>
      </div>

      <button
        type="submit"
        disabled={verifyMfaMutation.isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
      >
        {verifyMfaMutation.isPending ? (
          <LoadingSpinner size="sm" />
        ) : (
          "Kodu Doğrula ve Giriş Yap"
        )}
      </button>
    </form>
  );
}
