"use client";

import React from "react";
import { Modal } from "@/components/shared/Modal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Calendar, User, Info } from "lucide-react";

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: any;
  priorityLabels: Record<string, string>;
  priorityColors: Record<string, string>;
}

export function AnnouncementDetailModal({
  isOpen,
  onClose,
  isLoading,
  data,
  priorityLabels,
  priorityColors,
}: AnnouncementDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Duyuru Detayı" size="md">
      {isLoading ? (
        <div className="py-8 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        data && (
          <div className="space-y-5">
            <div className="space-y-2 pb-3 border-b border-white/[0.06]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {data.title}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${priorityColors[data.priority as string]}`}
                >
                  {priorityLabels[data.priority as string]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(data.createdAt).toLocaleDateString("tr-TR")}
                </span>
                {data.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Yayınlayan: {data.author.name}
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              {data.content}
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
              <Info className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Bu duyuru tarafınızca okundu olarak işaretlendi.</span>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}
