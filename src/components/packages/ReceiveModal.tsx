"use client";

import React, { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { AlertCircle } from "lucide-react";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Array<{ id: string; unitNumber: string; blockName: string | null }>;
  onReceive: (carrierName: string, unitId: string) => void;
  isPending: boolean;
}

export function ReceiveModal({
  isOpen,
  onClose,
  units,
  onReceive,
  isPending,
}: ReceiveModalProps) {
  const [carrierName, setCarrierName] = useState("");
  const [unitId, setUnitId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReceive(carrierName, unitId);
    setCarrierName("");
    setUnitId("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Kargo Girişi Kaydet">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Kargo Firması / Taşıyıcı
          </label>
          <input
            type="text"
            placeholder="Örn: Yurtiçi Kargo, Trendyol, Getir"
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Teslim Alınacak Daire
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm appearance-none bg-slate-900"
            required
          >
            <option value="" className="bg-slate-900">
              Daire Seçin...
            </option>
            {units.map((u) => (
              <option key={u.id} value={u.id} className="bg-slate-900">
                {u.blockName} - {u.unitNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            Kargo kaydedildiğinde, daire sakinlerine uygulama içi anlık bildirim
            gidecek ve **6 haneli benzersiz bir teslimat OTP kodu**
            oluşturulacaktır.
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            "Kargoyu Kaydet ve Bildir"
          )}
        </button>
      </form>
    </Modal>
  );
}
