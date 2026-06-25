import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { OnboardingForm } from "./OnboardingForm";
import type { InvitationDetails } from "@/lib/types";

interface InvitationJoinCardProps {
  onBack: () => void;
}

export function InvitationJoinCard({ onBack }: InvitationJoinCardProps) {
  const [step, setStep] = useState<"CHECK" | "ONBOARD">("CHECK");
  const [tokenCode, setTokenCode] = useState("");
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);

  const utils = trpc.useUtils();
  const [isValidating, setIsValidating] = useState(false);

  const registerMutation = trpc.onboarding.registerWithInvitation.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("auth-token", data.token);
      if (data.memberships && data.memberships.length > 0) {
        localStorage.setItem("active-site-id", data.memberships[0].siteId);
        localStorage.setItem(
          "active-membership-id",
          data.memberships[0].membershipId,
        );
      }
      showToast("success", `Kayıt Başarılı! Hoş geldiniz, ${data.user.name}!`);
      window.location.href = "/dashboard";
    },
    onError: (err) =>
      showToast("error", err.message || "Kayıt işlemi başarısız oldu"),
  });

  const loginMutation = trpc.onboarding.loginWithInvitation.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("auth-token", data.token);
      if (data.memberships && data.memberships.length > 0) {
        localStorage.setItem("active-site-id", data.memberships[0].siteId);
        localStorage.setItem(
          "active-membership-id",
          data.memberships[0].membershipId,
        );
      }
      showToast("success", `Giriş Başarılı! Hoş geldiniz, ${data.user.name}!`);
      window.location.href = "/dashboard";
    },
    onError: (err) =>
      showToast("error", err.message || "Giriş işlemi başarısız oldu"),
  });

  const handleCheckCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenCode.trim()) return;
    setIsValidating(true);
    try {
      const details = await utils.client.invitation.checkInvitation.query({
        token: tokenCode.trim().toUpperCase(),
      });
      setInvitationDetails(details);
      setStep("ONBOARD");
      showToast("success", "Aktivasyon kodu doğrulandı!");
    } catch (err: any) {
      showToast("error", err.message || "Geçersiz aktivasyon kodu!");
    } finally {
      setIsValidating(false);
    }
  };

  const handleOnboardSubmit = (
    mode: "REGISTER" | "LOGIN",
    name: string,
    email: string,
    pass: string,
  ) => {
    const token = tokenCode.trim().toUpperCase();
    if (mode === "REGISTER") {
      registerMutation.mutate({ name, email, password: pass, token });
    } else {
      loginMutation.mutate({ email, password: pass, token });
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={step === "ONBOARD" ? () => setStep("CHECK") : onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Geri Dön
      </button>

      {step === "CHECK" ? (
        <form onSubmit={handleCheckCode} className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-bold flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-primary" />
              Aktivasyon Kodu Girişi
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Yönetim tarafından size iletilen 8 haneli tek kullanımlık
              aktivasyon kodunu buraya girin.
            </p>
          </div>

          <input
            type="text"
            placeholder="ÖRN: AP-A12B-3C4D"
            value={tokenCode}
            onChange={(e) => setTokenCode(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-3 text-sm uppercase text-center font-bold tracking-wider focus:outline-none"
            required
            autoFocus
          />

          <button
            type="submit"
            disabled={isValidating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all shadow-glow flex items-center justify-center gap-2"
          >
            {isValidating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span>Kodu Doğrula</span>
            )}
          </button>
        </form>
      ) : (
        <OnboardingForm
          invitationDetails={invitationDetails}
          isPending={registerMutation.isPending || loginMutation.isPending}
          onSubmit={handleOnboardSubmit}
        />
      )}
    </div>
  );
}
