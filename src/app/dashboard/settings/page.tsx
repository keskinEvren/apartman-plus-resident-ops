"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RoleManager } from "@/components/settings/RoleManager";
import { MemberManager } from "@/components/settings/MemberManager";
import { PropertyManager } from "@/components/settings/PropertyManager";
import { InvitationManager } from "@/components/settings/InvitationManager";
import { AccountTab } from "@/components/settings/AccountTab";
import { User, Shield, Users, Building, Mail } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("ACCOUNT");
  const activeSiteId =
    typeof window !== "undefined"
      ? localStorage.getItem("active-site-id")
      : null;

  // 1. Fetch user role and memberships
  const { data: mySites = [], isLoading: loadingSites } =
    trpc.site.getMySites.useQuery();
  const currentMembership = mySites?.find((s) => s.site?.id === activeSiteId);
  const isAdmin =
    currentMembership?.role?.name === "SITE_ADMIN" ||
    currentMembership?.role?.name === "SUPER_ADMIN";

  // Pre-fetch roles & units for subcomponents
  const { data: roles = [] } = trpc.site.listRoles.useQuery(
    { siteId: activeSiteId! },
    { enabled: !!activeSiteId && isAdmin },
  );
  const { data: units = [] } = trpc.site.listUnits.useQuery(undefined, {
    enabled: !!activeSiteId && isAdmin,
  });

  const handleSiteSwitch = (siteId: string, siteName: string) => {
    if (siteId === activeSiteId) return;
    localStorage.setItem("active-site-id", siteId);
    showToast("success", `Oturum "${siteName}" sitesine başarıyla geçirildi!`);
    window.location.reload();
  };

  const handleSimulatedSwap = (email: string, pass: string) => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("active-site-id");
    loginMutation.mutate({ email, password: pass });
  };

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

        {/* Admin Tabs */}
        {isAdmin && activeSiteId && (
          <div className="flex flex-wrap bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 gap-1 w-full xl:w-auto shrink-0 animate-fade-in">
            <button
              onClick={() => setActiveTab("ACCOUNT")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === "ACCOUNT"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Hesap & Katılım
            </button>
            <button
              onClick={() => setActiveTab("PROPERTIES")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === "PROPERTIES"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              Mülk Yönetimi
            </button>
            <button
              onClick={() => setActiveTab("ROLES")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === "ROLES"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Rol Tanımlama
            </button>
            <button
              onClick={() => setActiveTab("INVITE")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === "INVITE"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Üye Davet Et
            </button>
            <button
              onClick={() => setActiveTab("MEMBERS")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === "MEMBERS"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Üye Yönetimi
            </button>
          </div>
        )}
      </div>

      {activeTab === "ACCOUNT" && (
        <AccountTab
          mySites={mySites}
          activeSiteId={activeSiteId}
          currentMembership={currentMembership}
          handleSiteSwitch={handleSiteSwitch}
          handleSimulatedSwap={handleSimulatedSwap}
          isPending={loginMutation.isPending}
        />
      )}

      {activeTab === "PROPERTIES" && activeSiteId && (
        <PropertyManager siteId={activeSiteId} />
      )}

      {activeTab === "ROLES" && activeSiteId && (
        <RoleManager siteId={activeSiteId} />
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
