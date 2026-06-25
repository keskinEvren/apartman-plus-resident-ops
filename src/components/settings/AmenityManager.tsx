"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { AmenityList } from "./AmenityList";
import { SessionManager } from "./SessionManager";
import { ShieldAlert } from "lucide-react";

interface AmenityManagerProps {
  siteId: string;
}

export function AmenityManager({ siteId }: AmenityManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: amenities = [], isLoading } =
    trpc.amenity.listAmenities.useQuery({ includeInactive: true });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in text-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AmenityList
          amenities={amenities}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <div>
          {selectedId ? (
            <SessionManager amenityId={selectedId} />
          ) : (
            <GlassCard className="p-8 text-center space-y-3 h-full flex flex-col justify-center items-center">
              <ShieldAlert className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground">
                Lütfen seanslarını ve kontenjanlarını yönetmek için sol listeden
                bir tesis seçin.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
