"use client";

import React, { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (category: string, title: string, description: string) => void;
  isPending: boolean;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  onCreate,
  isPending,
}: CreateTicketModalProps) {
  const [category, setCategory] = useState("TECHNICAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(category, title, description);
    setCategory("TECHNICAL");
    setTitle("");
    setDescription("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Destek Talebi Oluştur">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm appearance-none bg-slate-900"
            required
          >
            <option value="TECHNICAL" className="bg-slate-900">
              Teknik Arıza / Onarım
            </option>
            <option value="CLEANING" className="bg-slate-900">
              Temizlik / Hijyen
            </option>
            <option value="SECURITY" className="bg-slate-900">
              Güvenlik / Asayiş
            </option>
            <option value="OTHER" className="bg-slate-900">
              Diğer
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Başlık / Konu
          </label>
          <input
            type="text"
            placeholder="Örn: Banyo bataryası sızdırıyor, Asansör arızası"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Açıklama
          </label>
          <textarea
            placeholder="Sorunun detaylarını, nerede olduğunu yazın..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <LoadingSpinner size="sm" /> : "Talebi Gönder"}
        </button>
      </form>
    </Modal>
  );
}
