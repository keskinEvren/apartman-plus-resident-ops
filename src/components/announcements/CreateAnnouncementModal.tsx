"use client";

import React, { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Bell } from "lucide-react";

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    title: string,
    content: string,
    priority: "NORMAL" | "IMPORTANT" | "URGENT",
  ) => void;
  isPending: boolean;
}

export function CreateAnnouncementModal({
  isOpen,
  onClose,
  onCreate,
  isPending,
}: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">(
    "NORMAL",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(title, content, priority);
    setTitle("");
    setContent("");
    setPriority("NORMAL");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Duyuru Yayınla">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Duyuru Öncelik Derecesi
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm appearance-none bg-slate-900"
            required
          >
            <option value="NORMAL" className="bg-slate-900">
              Normal (Duyuru)
            </option>
            <option value="IMPORTANT" className="bg-slate-900">
              Önemli (Glow Efektli)
            </option>
            <option value="URGENT" className="bg-slate-900">
              Acil Durum (Pulsing Kırmızı)
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Başlık
          </label>
          <input
            type="text"
            placeholder="Örn: Havuz İlaçlama Çalışması, Asansör Bakımı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            İçerik
          </label>
          <textarea
            placeholder="Duyuru detaylarını ve sakinlerin alması gereken önlemleri açıklayın..."
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-none"
            required
          />
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
          <Bell className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            Duyuru yayınlandığında, sitenizdeki tüm aktif sakinlere anlık
            bildirim gönderilir ve okunduğu an okundu damgası (read receipt)
            veritabanına otomatik kaydedilir.
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <LoadingSpinner size="sm" /> : "Duyuruyu Yayınla"}
        </button>
      </form>
    </Modal>
  );
}
