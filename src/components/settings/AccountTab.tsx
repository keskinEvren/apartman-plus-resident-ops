"use client";

import React from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { SiteSwitcher } from "./SiteSwitcher";
import { JoinSiteCard } from "./JoinSiteCard";
import { MembershipDetails } from "./MembershipDetails";
import { SettingsRoleSimulator } from "./SettingsRoleSimulator";

interface AccountTabProps {
  mySites: any[];
  activeSiteId: string | null;
  activeMembershipId?: string | null;
  currentMembership: any;
}

export function AccountTab({
  mySites,
  activeSiteId,
  activeMembershipId,
  currentMembership,
}: AccountTabProps) {
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("auth-token", data.token);
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

  const handleSiteSwitch = (
    siteId: string,
    siteName: string,
    membershipId: string,
  ) => {
    localStorage.setItem("active-site-id", siteId);
    localStorage.setItem("active-membership-id", membershipId);
    showToast("success", `Oturum "${siteName}" sitesine başarıyla geçirildi!`);
    window.location.reload();
  };

  const handleSimulatedSwap = (email: string, pass: string) => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("active-site-id");
    loginMutation.mutate({ email, password: pass });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">
      <div className="lg:col-span-7 space-y-6">
        <SiteSwitcher
          mySites={mySites}
          activeSiteId={activeSiteId}
          activeMembershipId={activeMembershipId}
          onSiteSwitch={handleSiteSwitch}
        />

        <JoinSiteCard />

        {currentMembership && (
          <MembershipDetails currentMembership={currentMembership} />
        )}
      </div>

      <div className="lg:col-span-5 space-y-6">
        <GlassCard className="gradient-border p-6 space-y-4">
          <SettingsRoleSimulator
            currentRole={currentMembership?.role?.name || ""}
            onSwap={handleSimulatedSwap}
            isPending={loginMutation.isPending}
          />
        </GlassCard>
      </div>
    </div>
  );
}
