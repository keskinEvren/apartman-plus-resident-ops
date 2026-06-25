"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { GlassCard } from "@/components/shared/GlassCard";
import { Plus, Sparkles } from "lucide-react";
import { MockPetPhotoUploader } from "./MockPetPhotoUploader";

interface PetAddFormProps {
  onSuccess: () => void;
}

export function PetAddForm({ onSuccess }: PetAddFormProps) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Kedi");
  const [breed, setBreed] = useState("");
  const [vaccineStatus, setVaccineStatus] = useState("Aşıları Tam");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const createPet = trpc.pet.createPet.useMutation({
    onSuccess: () => {
      showToast("success", "Evcil hayvanınız başarıyla kaydedildi!");
      setName("");
      setSpecies("Kedi");
      setBreed("");
      setVaccineStatus("Aşıları Tam");
      setNotes("");
      setPhoto(null);
      onSuccess();
    },
    onError: (err) =>
      showToast("error", err.message || "Evcil hayvan kaydedilemedi"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim())
      createPet.mutate({ name, species, breed, vaccineStatus, notes });
  };

  return (
    <GlassCard className="p-6 space-y-4 text-xs">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-primary" /> Evcil Hayvan Ekle
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-semibold">
            Hayvanın Adı
          </label>
          <input
            id="pet-name-input"
            placeholder="Pamuk, Karabaş vb."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field w-full rounded-xl px-3 py-2 text-sm"
            required
          />
        </div>

        <MockPetPhotoUploader photo={photo} onChange={setPhoto} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">
              Türü
            </label>
            <select
              id="pet-species-select"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="input-field w-full rounded-xl px-2 py-2 text-sm"
            >
              {["Kedi", "Köpek", "Kuş", "Diğer"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">
              Cinsi / Irkı
            </label>
            <input
              id="pet-breed-input"
              placeholder="Van Kedisi vb."
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="input-field w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-semibold">
            Aşı Durumu
          </label>
          <select
            id="pet-vaccine-select"
            value={vaccineStatus}
            onChange={(e) => setVaccineStatus(e.target.value)}
            className="input-field w-full rounded-xl px-2 py-2 text-sm"
          >
            {["Aşıları Tam", "Eksik Aşıları Var", "Aşı Takibi Yapılmıyor"].map(
              (v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-semibold">
            Özel Notlar
          </label>
          <textarea
            id="pet-notes-input"
            placeholder="Alerjileri, özel alışkanlıkları vb."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field w-full rounded-xl px-3 py-2 text-sm min-h-[60px] resize-none"
          />
        </div>

        <button
          id="pet-submit-btn"
          type="submit"
          disabled={createPet.isPending}
          className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
        >
          <Plus className="h-4 w-4" /> Hayvan Kaydet
        </button>
      </form>
    </GlassCard>
  );
}
