"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ReceiveModal } from "@/components/packages/ReceiveModal";
import { DeliverModal } from "@/components/packages/DeliverModal";
import { ResidentPackageList } from "@/components/packages/ResidentPackageList";
import { StaffPackageList } from "@/components/packages/StaffPackageList";
import { Package, PlusCircle } from "lucide-react";

export function PackagesClient() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );

  const utils = trpc.useUtils();
  const activeSiteId =
    typeof window !== "undefined"
      ? localStorage.getItem("active-site-id")
      : null;

  const { data: mySites, isLoading: loadingSites } =
    trpc.site.getMySites.useQuery();
  const currentMembership = mySites?.find((s) => s.site?.id === activeSiteId);
  const isStaff =
    currentMembership?.role?.name === "STAFF" ||
    currentMembership?.role?.name === "SITE_ADMIN" ||
    currentMembership?.role?.name === "SUPER_ADMIN";

  const { data: myPackages = [], isLoading: loadingMyPackages } =
    trpc.package.listMyPackages.useQuery(undefined, {
      enabled: !isStaff && !!activeSiteId,
    });

  const { data: sitePackages = [], isLoading: loadingSitePackages } =
    trpc.package.listSitePackages.useQuery(undefined, {
      enabled: isStaff && !!activeSiteId,
    });

  const { data: units = [] } = trpc.site.listUnits.useQuery(undefined, {
    enabled: isStaff && !!activeSiteId,
  });

  const receiveMutation = trpc.package.receivePackage.useMutation({
    onSuccess: () => {
      showToast(
        "success",
        "Kargo kaydı başarıyla oluşturuldu, sakine OTP bildirimi iletildi!",
      );
      utils.package.listSitePackages.invalidate();
      setIsAddOpen(false);
    },
    onError: (err) => showToast("error", err.message || "Kargo kaydedilemedi"),
  });

  const deliverMutation = trpc.package.verifyOtpAndDeliver.useMutation({
    onSuccess: () => {
      showToast("success", "Kargo başarıyla sakine teslim edildi!");
      utils.package.listSitePackages.invalidate();
      setIsDeliverOpen(false);
      setSelectedPackageId(null);
    },
    onError: (err) =>
      showToast("error", err.message || "OTP doğrulama başarısız oldu"),
  });

  const handleReceive = (carrierName: string, unitId: string) => {
    receiveMutation.mutate({ carrierName, unitId });
  };

  const handleDeliver = (otpCode: string) => {
    if (!selectedPackageId) return;
    deliverMutation.mutate({ packageId: selectedPackageId, otpCode });
  };

  const activePackagesCount = (isStaff ? sitePackages : myPackages).filter(
    (p) => p.status === "RECEIVED",
  ).length;

  if (loadingSites || (isStaff ? loadingSitePackages : loadingMyPackages)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Kargo Takip</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isStaff
              ? "Rezidansa ulaşan kargoları kaydedin ve OTP koduyla güvenli teslimat yapın"
              : "Dairenize ulaşan paketleri görüntüleyin ve teslimat kodlarınızı yönetin"}
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Yeni Kargo Girişi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <GlassCard className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold font-heading">
              {activePackagesCount}
            </p>
            <p className="text-xs text-muted-foreground">
              Bekleyen Paket Sayısı
            </p>
          </div>
        </GlassCard>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {isStaff ? "Site Kargo Teslimatları" : "Kargo Geçmişim"}
        </h2>

        {isStaff ? (
          <StaffPackageList
            packages={sitePackages}
            onDeliverClick={(id) => {
              setSelectedPackageId(id);
              setIsDeliverOpen(true);
            }}
          />
        ) : (
          <ResidentPackageList packages={myPackages} />
        )}
      </section>

      <ReceiveModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        units={units}
        onReceive={handleReceive}
        isPending={receiveMutation.isPending}
      />

      <DeliverModal
        isOpen={isDeliverOpen}
        onClose={() => {
          setIsDeliverOpen(false);
          setSelectedPackageId(null);
        }}
        onDeliver={handleDeliver}
        isPending={deliverMutation.isPending}
      />
    </div>
  );
}
