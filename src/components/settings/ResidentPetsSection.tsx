"use client";

import React from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Heart } from "lucide-react";

interface ResidentPetsSectionProps {
  pets: any[];
}

export function ResidentPetsSection({ pets }: ResidentPetsSectionProps) {
  return (
    <GlassCard className="p-4 space-y-4 h-full flex flex-col justify-start">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
        <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> Sakinin Evcil
        Hayvanları ({pets.length})
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[220px] pr-1">
        {pets.map((pet) => (
          <div
            key={pet.id}
            className="p-3 bg-muted border border-border rounded-lg flex flex-col justify-between"
          >
            <div>
              <p className="font-bold text-xs text-foreground">🐾 {pet.name}</p>
              <p className="text-[9px] text-primary/80 font-semibold mt-0.5">
                {pet.species} {pet.breed ? `(${pet.breed})` : ""}
              </p>
              {pet.notes && (
                <p className="text-[9px] text-muted-foreground mt-1.5 bg-muted p-1.5 rounded italic">
                  &ldquo;{pet.notes}&rdquo;
                </p>
              )}
            </div>
            <p className="text-[8px] text-muted-foreground mt-2 border-t border-border pt-2">
              {pet.vaccineStatus}
            </p>
          </div>
        ))}
        {pets.length === 0 && (
          <p className="text-[11px] text-muted-foreground/60 italic py-8 text-center col-span-full">
            Kayıtlı evcil hayvanı bulunmuyor.
          </p>
        )}
      </div>
    </GlassCard>
  );
}
