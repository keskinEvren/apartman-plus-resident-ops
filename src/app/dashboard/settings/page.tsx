"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RoleManager } from "@/components/settings/RoleManager";
import { MemberManager } from "@/components/settings/MemberManager";
import { PropertyManager } from "@/components/settings/PropertyManager";
import { InvitationManager } from "@/components/settings/InvitationManager";
import { AccountTab } from "@/components/settings/AccountTab";
import { AmenityManager } from "@/components/settings/AmenityManager";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { PetsTab } from "@/components/settings/PetsTab";
import { NotificationTab } from "@/components/settings/NotificationTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { cn } from "@/lib/utils";
import { getGroupedTabs } from "./SettingsData";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "ACCOUNT";

  const activeSiteId =
    typeof window !== "undefined"
      ? localStorage.getItem("active-site-id")
      : null;
  const activeMembershipId =
    typeof window !== "undefined"
      ? localStorage.getItem("active-membership-id")
      : null;

  const { data: mySites = [], isLoading: loadingSites } =
    trpc.site.getMySites.useQuery();
  const currentMembership = activeMembershipId
    ? mySites?.find((s) => s.membershipId === activeMembershipId)
    : mySites?.find((s) => s.site?.id === activeSiteId);
  const isAdmin =
    currentMembership?.role?.name === "SITE_ADMIN" ||
    currentMembership?.role?.name === "SUPER_ADMIN";

  const groupedTabs = getGroupedTabs(!!isAdmin);

  const { data: roles = [] } = trpc.site.listRoles.useQuery(
    { siteId: activeSiteId! },
    { enabled: !!activeSiteId && isAdmin },
  );
  const { data: units = [] } = trpc.site.listUnits.useQuery(undefined, {
    enabled: !!activeSiteId && isAdmin,
  });

  if (loadingSites)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Ayarlar
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kişisel tercihlerinizi, daire üyelerinizi ve mülkünüzün operasyonel
          ayarlarını yönetin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3 space-y-6 p-4 rounded-lg bg-card border border-border">
          {groupedTabs.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="px-2 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() =>
                        router.push(`/dashboard/settings?tab=${tab.id}`)
                      }
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-9">
          {activeTab === "ACCOUNT" && (
            <AccountTab
              mySites={mySites}
              activeSiteId={activeSiteId}
              activeMembershipId={activeMembershipId}
              currentMembership={currentMembership}
            />
          )}
          {activeTab === "PROFILE" && <ProfileTab />}
          {activeTab === "SECURITY" && <SecurityTab />}
          {activeTab === "PETS" && <PetsTab />}
          {activeTab === "NOTIFICATIONS" && <NotificationTab />}
          {activeTab === "PROPERTIES" && activeSiteId && (
            <PropertyManager siteId={activeSiteId} />
          )}
          {activeTab === "ROLES" && activeSiteId && (
            <RoleManager siteId={activeSiteId} />
          )}
          {activeTab === "AMENITIES" && activeSiteId && (
            <AmenityManager siteId={activeSiteId} />
          )}
          {activeTab === "INVITE" && activeSiteId && (
            <InvitationManager
              siteId={activeSiteId}
              roles={roles}
              units={units}
            />
          )}
          {activeTab === "MEMBERS" && activeSiteId && (
            <MemberManager siteId={activeSiteId} roles={roles} />
          )}
        </div>
      </div>
    </div>
  );
}
