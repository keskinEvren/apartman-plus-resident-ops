"use client";

import React from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ReservationTable } from "./ReservationTable";

interface MyReservationsSectionProps {
  loading: boolean;
  reservations: any[];
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

export function MyReservationsSection({
  loading,
  reservations,
  onCancel,
  isCancelling,
}: MyReservationsSectionProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Rezervasyonlarım
      </h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ReservationTable
          reservations={reservations}
          onCancel={onCancel}
          isCancelling={isCancelling}
        />
      )}
    </section>
  );
}
