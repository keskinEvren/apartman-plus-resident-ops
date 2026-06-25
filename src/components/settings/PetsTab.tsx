"use client";

import React from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { PetAddForm } from "./PetAddForm";
import { Trash2, Heart, Shield } from "lucide-react";

export function PetsTab() {
  const utils = trpc.useUtils();
  const { data: pets = [], isLoading } = trpc.pet.listMyPets.useQuery();

  const deletePet = trpc.pet.deletePet.useMutation({
    onSuccess: () => {
      showToast("success", "Evcil hayvan kaydı silindi.");
      utils.pet.listMyPets.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  return (
    <div className="space-y-6 animate-fade-in text-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Add Pet Form */}
        <div className="lg:col-span-5">
          <PetAddForm onSuccess={() => utils.pet.listMyPets.invalidate()} />
        </div>

        {/* Right Side: Pets List */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6 space-y-4 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> Evcil
              Hayvanlarım ({pets.length})
            </h3>
            {isLoading ? (
              <LoadingSpinner className="my-auto py-8" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[420px] pr-1 text-xs">
                {pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="p-4 bg-secondary border border-border rounded-xl flex flex-col justify-between hover:bg-secondary transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <span>🐾</span> {pet.name}
                        </p>
                        <button
                          onClick={() => deletePet.mutate({ petId: pet.id })}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 p-1 transition-all rounded"
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-primary/80 font-semibold mt-1">
                        {pet.species} {pet.breed ? `(${pet.breed})` : ""}
                      </p>
                      {pet.notes && (
                        <p className="text-[10px] text-muted-foreground mt-2 bg-black/15 p-2 rounded-lg italic">
                          &ldquo;{pet.notes}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Shield
                        className={`h-3 w-3 ${pet.vaccineStatus === "Aşıları Tam" ? "text-emerald-600" : "text-amber-600"}`}
                      />
                      <span>{pet.vaccineStatus}</span>
                    </div>
                  </div>
                ))}
                {pets.length === 0 && (
                  <div className="col-span-full my-auto text-center py-12 space-y-2">
                    <p className="text-xs text-muted-foreground/60 italic">
                      Henüz kayıtlı bir evcil hayvanınız bulunmuyor.
                    </p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
