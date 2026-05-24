"use client";

import React from "react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Clock, AlertTriangle } from "lucide-react";

interface ReadReceiptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  receipts: any[];
}

export function ReadReceiptsModal({
  isOpen,
  onClose,
  isLoading,
  receipts,
}: ReadReceiptsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duyuru Okunma Raporu"
      size="md"
    >
      {isLoading ? (
        <div className="py-8 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              Aşağıdaki sakinler bu duyuruyu kendi mobil panellerinden
              görüntülemiştir.
            </span>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {receipts.map((rec) => (
              <div
                key={rec.id}
                className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl flex justify-between items-center text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    {rec.user?.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {rec.user?.email}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground bg-white/[0.04] px-2.5 py-1 rounded border border-white/[0.06]">
                  {new Date(rec.readAt).toLocaleString("tr-TR")}
                </span>
              </div>
            ))}

            {receipts.length === 0 && (
              <div className="text-center py-6">
                <AlertTriangle className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Henüz bu duyuruyu okuyan sakin bulunmuyor.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
