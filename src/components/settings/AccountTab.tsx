import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { SiteSwitcher } from "./SiteSwitcher";
import { JoinSiteCard } from "./JoinSiteCard";
import { MembershipDetails } from "./MembershipDetails";
import { SettingsRoleSimulator } from "./SettingsRoleSimulator";

interface AccountTabProps {
  mySites: any[];
  activeSiteId: string | null;
  currentMembership: any;
  handleSiteSwitch: (siteId: string, siteName: string) => void;
  handleSimulatedSwap: (email: string, pass: string) => void;
  isPending: boolean;
}

export function AccountTab({
  mySites,
  activeSiteId,
  currentMembership,
  handleSiteSwitch,
  handleSimulatedSwap,
  isPending,
}: AccountTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <SiteSwitcher
          mySites={mySites}
          activeSiteId={activeSiteId}
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
            isPending={isPending}
          />
        </GlassCard>
      </div>
    </div>
  );
}
