"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoginHero } from "@/components/login/LoginHero";
import { InvitationJoinCard } from "@/components/login/InvitationJoinCard";
import { LoginFormCard } from "@/components/login/LoginFormCard";
import { Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const router = useRouter();
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [simulatedCredentials, setSimulatedCredentials] = useState<{
    email: string;
    pass: string;
    trigger: number;
  } | null>(null);

  useEffect(() => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("active-site-id");
    localStorage.removeItem("active-membership-id");
  }, []);

  const handleLoginSuccess = (data: {
    token: string;
    user: any;
    memberships: any[];
  }) => {
    localStorage.setItem("auth-token", data.token);
    if (data.memberships && data.memberships.length > 0) {
      localStorage.setItem("active-site-id", data.memberships[0].siteId);
      localStorage.setItem(
        "active-membership-id",
        data.memberships[0].membershipId,
      );
    }
    showToast("success", `Hoş geldiniz, ${data.user.name}!`);
    router.push("/dashboard");
  };

  const handleSimulatedSelect = (roleEmail: string, rolePass: string) => {
    // Set simulated credentials to trigger login form reload/autofill
    setSimulatedCredentials({
      email: roleEmail,
      pass: rolePass,
      trigger: Date.now(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        <LoginHero onSelect={handleSimulatedSelect} />

        <div className="lg:col-span-5 flex flex-col justify-center">
          <GlassCard className="gradient-border p-8 space-y-6">
            {showJoinCode ? (
              <InvitationJoinCard onBack={() => setShowJoinCode(false)} />
            ) : (
              <>
                <LoginFormCard
                  onSuccess={handleLoginSuccess}
                  initialEmail={simulatedCredentials?.email}
                  initialPassword={simulatedCredentials?.pass}
                  autofillTrigger={simulatedCredentials?.trigger}
                />

                <div className="flex flex-col gap-3 pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowJoinCode(true)}
                    className="text-xs text-primary hover:underline hover:text-primary/90 transition-all font-semibold"
                  >
                    Aktivasyon Koduyla Siteye Katıl
                  </button>
                  <div className="border-t border-white/[0.06] pt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Multi-Tenant apartman altyapısı aktiftir</span>
                  </div>
                </div>
              </>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
