"use client";

import React from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { VisitorForm } from "@/components/visitors/VisitorForm";
import { VisitorTable } from "@/components/visitors/VisitorTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function VisitorsClient() {
  const utils = trpc.useUtils();

  const { data: myPasses = [], isLoading: loadingMy } =
    trpc.visitor.listMyVisitorPasses.useQuery();

  const { data: expectedToday = [], isLoading: loadingExpected } =
    trpc.visitor.listExpectedVisitors.useQuery({});

  const createMutation = trpc.visitor.createVisitorPass.useMutation({
    onSuccess: () => {
      showToast("success", "Ziyaretçi ön kaydı oluşturuldu!");
      utils.visitor.listMyVisitorPasses.invalidate();
      utils.visitor.listExpectedVisitors.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  const checkInMutation = trpc.visitor.checkInVisitor.useMutation({
    onSuccess: () => {
      showToast("success", "Ziyaretçi giriş kaydı yapıldı!");
      utils.visitor.listExpectedVisitors.invalidate();
      utils.visitor.listMyVisitorPasses.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">Ziyaretçi Ön Kayıt</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ziyaretçileriniz için ön kayıt oluşturun, güvenlik ekibini bilgilendirin
        </p>
      </div>

      {/* Registration Form */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Yeni Kayıt
        </h2>
        <VisitorForm
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      </section>

      {/* My Visitor Passes */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Kayıtlarım
        </h2>
        {loadingMy ? (
          <LoadingSpinner />
        ) : (
          <VisitorTable passes={myPasses} />
        )}
      </section>

      {/* Expected Today (Staff/Admin) */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Bugün Beklenen Ziyaretçiler
        </h2>
        {loadingExpected ? (
          <LoadingSpinner />
        ) : (
          <VisitorTable
            passes={expectedToday}
            showCheckIn
            onCheckIn={(id) => checkInMutation.mutate({ passId: id })}
            isCheckingIn={checkInMutation.isPending}
          />
        )}
      </section>
    </div>
  );
}
