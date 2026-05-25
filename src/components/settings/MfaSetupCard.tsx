"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MfaActiveView } from "./MfaActiveView";
import { Shield, ShieldAlert, Copy, Check } from "lucide-react";

export function MfaSetupCard() {
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();
  const { data: userProfile, isLoading: loadingProfile } =
    trpc.user.me.useQuery();

  const generateMutation = trpc.security.generate2faSecret.useMutation({
    onSuccess: (data) => {
      setSetupSecret(data.secret);
      setVerificationCode("");
    },
    onError: (err) => showToast("error", err.message || "Secret üretilemedi"),
  });

  const enableMutation = trpc.security.enable2fa.useMutation({
    onSuccess: () => {
      showToast("success", "İki aşamalı doğrulama başarıyla aktifleştirildi!");
      setSetupSecret(null);
      utils.user.me.invalidate();
    },
    onError: (err) => showToast("error", err.message || "Doğrulama başarısız"),
  });

  const handleCopy = () => {
    if (setupSecret) {
      navigator.clipboard.writeText(setupSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("success", "Secret kopyalandı!");
    }
  };

  if (loadingProfile || !userProfile) return <LoadingSpinner size="sm" />;

  const is2faEnabled = (userProfile as any).twoFactorEnabled;

  return (
    <GlassCard className="gradient-border p-5 space-y-4 flex flex-col justify-between h-full text-xs">
      <div className="space-y-3.5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-primary" /> İki Aşamalı Doğrulama
          (2FA)
        </h3>

        {is2faEnabled ? (
          <MfaActiveView onSuccess={() => utils.user.me.invalidate()} />
        ) : (
          <div className="space-y-3.5">
            {!setupSecret ? (
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center gap-3">
                  <ShieldAlert className="h-8 w-8 text-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-foreground">2FA Aktif Değil</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Hesap güvenliğinizi hemen artırın.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-bold transition-all shadow-glow"
                >
                  {generateMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    "2FA Kurulumunu Başlat"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3 bg-black/20 border border-white/[0.04] rounded-xl space-y-2">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase">
                    1. Adım: Kodu Manuel Ekleyin
                  </p>
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-lg gap-2">
                    <code className="font-mono font-bold text-sm tracking-wider text-primary">
                      {setupSecret}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-1 hover:bg-white/[0.06] rounded text-muted-foreground"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-[10px] text-muted-foreground uppercase">
                    2. Adım: Kodu Doğrulayın
                  </p>
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
                    onClick={() =>
                      enableMutation.mutate({
                        secret: setupSecret,
                        code: verificationCode,
                      })
                    }
                    disabled={
                      enableMutation.isPending || verificationCode.length !== 6
                    }
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-bold transition-all shadow-glow"
                  >
                    {enableMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      "Doğrula ve Etkinleştir"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
