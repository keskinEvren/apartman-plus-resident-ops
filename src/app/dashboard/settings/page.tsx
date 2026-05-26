"use client";

import React, { useState } from "react";
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
import {
  User,
  Shield,
  Users,
  Building,
  Mail,
  CalendarDays,
  Sparkles,
  Heart,
  Bell,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("ACCOUNT");
  const activeSiteId =
    typeof window !== "undefined"
      ? localStorage.getItem("active-site-id")
      : null;
  const activeMembershipId =
    typeof window !== "undefined"
      ? localStorage.getItem("active-membership-id")
      : null;

  // 1. Fetch user role and memberships
  const { data: mySites = [], isLoading: loadingSites } =
    trpc.site.getMySites.useQuery();

  // Find membership matching activeMembershipId first, fallback to activeSiteId
  const currentMembership = activeMembershipId
    ? mySites?.find((s) => s.membershipId === activeMembershipId)
    : mySites?.find((s) => s.site?.id === activeSiteId);

  const isAdmin =
    currentMembership?.role?.name === "SITE_ADMIN" ||
    currentMembership?.role?.name === "SUPER_ADMIN";

  const tabs = [
    { id: "ACCOUNT", label: "Hesap & Katılım", icon: User },
    { id: "PROFILE", label: "Profilim", icon: Sparkles },
    { id: "SECURITY", label: "Güvenlik", icon: Lock },
    { id: "PETS", label: "Evcil Hayvanlarım", icon: Heart },
    { id: "NOTIFICATIONS", label: "Bildirimlerim", icon: Bell },
    ...(isAdmin
      ? [
          { id: "PROPERTIES", label: "Mülk Yönetimi", icon: Building },
          { id: "ROLES", label: "Rol Tanımlama", icon: Shield },
          { id: "AMENITIES", label: "Tesis Yönetimi", icon: CalendarDays },
          { id: "INVITE", label: "Üye Davet Et", icon: Mail },
          { id: "MEMBERS", label: "Üye Yönetimi", icon: Users },
        ]
      : []),
  ];

  const { data: roles = [] } = trpc.site.listRoles.useQuery(
    { siteId: activeSiteId! },
    { enabled: !!activeSiteId && isAdmin },
  );
  const { data: units = [] } = trpc.site.listUnits.useQuery(undefined, {
    enabled: !!activeSiteId && isAdmin,
  });

  if (loadingSites) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Ayarlar & Üyelikler
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Site oturumunu değiştirin, daire tanımlayın, dinamik rolleri
            yapılandırın veya sakin üyeliklerini yönetin
          </p>
        </div>

        {/* Ayarlar Sekmeleri */}
        {activeSiteId && (
          <div className="flex flex-wrap bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 gap-1 w-full xl:w-auto shrink-0 animate-fade-in">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                  activeTab === id
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

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
        <InvitationManager siteId={activeSiteId} roles={roles} units={units} />
      )}

      {activeTab === "MEMBERS" && activeSiteId && (
        <MemberManager siteId={activeSiteId} roles={roles} />
      )}
    </div>
  );
}
