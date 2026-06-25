"use client";

import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { JoinSiteCard } from "./JoinSiteCard";
import { MembershipDetails } from "./MembershipDetails";
import { SettingsRoleSimulator } from "./SettingsRoleSimulator";

interface AccountTabProps {
  mySites: any[];
  activeSiteId: string | null;
  activeMembershipId?: string | null;
  currentMembership: any;
}

export function AccountTab({ currentMembership }: AccountTabProps) {
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDevMode(localStorage.getItem("developer-mode") === "true");
    }
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("auth-token", data.token || "");
      if (data.memberships && data.memberships.length > 0) {
        localStorage.setItem("active-site-id", data.memberships[0].siteId);
      }
      showToast(
        "success",
        `Simülatör Aktif: ${data.user.name} rolüne geçildi!`,
      );
      window.location.reload();
    },
    onError: (err) => {
      showToast("error", err.message || "Simülasyon geçişi başarısız oldu");
    },
  });

  const handleSimulatedSwap = (email: string, pass: string) => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("active-site-id");
    loginMutation.mutate({ email, password: pass });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">
      <div
        className={
          isDevMode ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"
        }
      >
        <JoinSiteCard />

        {currentMembership && (
          <MembershipDetails currentMembership={currentMembership} />
        )}
      </div>

      {isDevMode && (
        <div className="lg:col-span-4">
          <GlassCard className="p-6 space-y-4">
            <SettingsRoleSimulator
              currentRole={currentMembership?.role?.name || ""}
              onSwap={handleSimulatedSwap}
              isPending={loginMutation.isPending}
            />
          </GlassCard>
        </div>
      )}
    </div>
  );
}
