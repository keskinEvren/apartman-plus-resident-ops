"use client";

import React from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AmenityCard } from "./AmenityCard";

interface AmenitySelectionSectionProps {
  loading: boolean;
  amenities?: any[];
  selectedAmenity: string | null;
  onSelect: (id: string) => void;
}

export function AmenitySelectionSection({
  loading,
  amenities = [],
  selectedAmenity,
  onSelect,
}: AmenitySelectionSectionProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Tesis Seçimi
      </h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {amenities.map((a) => (
            <AmenityCard
              key={a.id}
              id={a.id}
              name={a.name}
              description={a.description}
              isSelected={selectedAmenity === a.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
