"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { Plus, Sparkles } from "lucide-react";

interface AmenityListProps {
  amenities: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function AmenityList({
  amenities,
  selectedId,
  onSelect,
}: AmenityListProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const utils = trpc.useUtils();

  const createAmenity = trpc.amenity.createAmenity.useMutation({
    onSuccess: () => {
      showToast("success", "Tesis başarıyla eklendi!");
      setName("");
      setDescription("");
      utils.amenity.listAmenities.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  const toggleAmenity = trpc.amenity.toggleAmenityActive.useMutation({
    onSuccess: () => {
      showToast("success", "Tesis durumu güncellendi!");
      utils.amenity.listAmenities.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createAmenity.mutate({ name, description });
  };

  return (
    <div className="space-y-6">
      <GlassCard className="gradient-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          Yeni Tesis Ekle
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="Tesis Adı (Örn: Barbekü Alanı)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2 text-sm"
            required
          />
          <input
            placeholder="Açıklama / Kurallar"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={createAmenity.isPending}
            className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-glow"
          >
            <Plus className="h-4 w-4" /> Tesis Ekle
          </button>
        </form>
      </GlassCard>

      <GlassCard className="gradient-border p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Mevcut Tesisler
        </h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {amenities.map((a) => (
            <div
              key={a.id}
              onClick={() => onSelect(a.id)}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                selectedId === a.id
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
              }`}
            >
              <div>
                <p className="font-bold text-xs">{a.name}</p>
                {a.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {a.description}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAmenity.mutate({
                    amenityId: a.id,
                    isActive: !a.isActive,
                  });
                }}
                className={`text-[10px] px-2 py-1 rounded font-semibold transition ${
                  a.isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {a.isActive ? "Aktif" : "Pasif"}
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
