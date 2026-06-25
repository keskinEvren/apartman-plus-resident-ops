"use client";

import React from "react";
import { Modal } from "@/components/shared/Modal";
import { RefreshCw, ClipboardList, CheckCircle } from "lucide-react";

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
  isStaff: boolean;
  onAssign: () => void;
  onUpdateStatus: (
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED",
  ) => void;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  categoryLabels: Record<string, string>;
}

export function TicketDetailModal({
  isOpen,
  onClose,
  ticket,
  isStaff,
  onAssign,
  onUpdateStatus,
  statusLabels,
  statusColors,
  categoryLabels,
}: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Talep Detayı & Süreç Takibi"
      size="lg"
    >
      <div className="space-y-6">
        {/* Core Info */}
        <div className="space-y-3 pb-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-heading text-lg font-bold text-foreground">
              {ticket.title}
            </h3>
            <span
              className={`text-[10px] px-3 py-1 rounded-full font-bold border ${statusColors[ticket.status]}`}
            >
              {statusLabels[ticket.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="bg-secondary px-2 py-0.5 rounded border border-border">
              {categoryLabels[ticket.category]}
            </span>
            <span>
              Oluşturulma: {new Date(ticket.createdAt).toLocaleString("tr-TR")}
            </span>
          </div>
          <p className="text-sm bg-muted border border-border rounded-xl p-4 leading-relaxed text-muted-foreground">
            {ticket.description}
          </p>
        </div>

        {/* Staff Management Panel */}
        {isStaff && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Operasyon Yönetimi
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {!ticket.assignedStaffUserId ? (
                <button
                  onClick={onAssign}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <ClipboardList className="h-4 w-4" />
                  Talebi Üzerime Ata
                </button>
              ) : (
                <>
                  {ticket.status !== "RESOLVED" && (
                    <button
                      onClick={() => onUpdateStatus("RESOLVED")}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Çözüldü Olarak İşaretle
                    </button>
                  )}
                  {ticket.status !== "IN_PROGRESS" &&
                    ticket.status !== "RESOLVED" && (
                      <button
                        onClick={() => onUpdateStatus("IN_PROGRESS")}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-4 w-4" />
                        İşleme Al (In Progress)
                      </button>
                    )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Audit / Process Logs Timeline */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            İşlem ve SLA Tarihçesi
          </h4>
          <div className="relative border-l border-border pl-5 ml-2.5 space-y-5 py-1">
            {/* Timeline node */}
            <div className="relative">
              <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <p className="text-xs text-muted-foreground font-semibold">
                Tarihçe günlüğünüz otomatik işlenmektedir.
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                Tüm durum ve atama değişimleri zaman damgalarıyla kayıt
                altındadır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
