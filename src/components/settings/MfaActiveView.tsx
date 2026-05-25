"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ShieldCheck } from "lucide-react";

interface MfaActiveViewProps {
  onSuccess: () => void;
}

export function MfaActiveView({ onSuccess }: MfaActiveViewProps) {
  const [verificationCode, setVerificationCode] = useState("");

  const disableMutation = trpc.security.disable2fa.useMutation({
    onSuccess: () => {
      showToast("success", "İki aşamalı doğrulama devre dışı bırakıldı.");
      setVerificationCode("");
      onSuccess();
    },
    onError: (err) =>
      showToast("error", err.message || "İptal işlemi başarısız"),
  });

  return (
    <div className="space-y-4 text-xs">
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-emerald-400 shrink-0" />
        <div>
          <p className="font-bold text-emerald-400">2FA Aktif ve Koruyor</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Hesabınız Google Authenticator ile güvende.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground">
          Kapatmak için 6 Haneli Kodu Girin
        </label>
        <input
          type="text"
          maxLength={6}
          placeholder="000000"
          value={verificationCode}
          onChange={(e) =>
            setVerificationCode(e.target.value.replace(/\D/g, ""))
          }
          className="glass-input w-full rounded-lg px-3 py-2 text-sm text-center font-bold tracking-[0.3em] focus:outline-none"
        />
        <button
          onClick={() => disableMutation.mutate({ code: verificationCode })}
          disabled={disableMutation.isPending || verificationCode.length !== 6}
          className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 py-2 rounded-lg font-bold transition-all"
        >
          {disableMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            "2FA'yı Devre Dışı Bırak"
          )}
        </button>
      </div>
    </div>
  );
}
