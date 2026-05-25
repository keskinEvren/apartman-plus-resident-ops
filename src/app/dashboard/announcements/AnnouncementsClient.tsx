"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CreateAnnouncementModal } from "@/components/announcements/CreateAnnouncementModal";
import { AnnouncementDetailModal } from "@/components/announcements/AnnouncementDetailModal";
import { ReadReceiptsModal } from "@/components/announcements/ReadReceiptsModal";
import { AnnouncementList } from "@/components/announcements/AnnouncementList";
import { PlusCircle } from "lucide-react";

export function AnnouncementsClient() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReceiptsOpen, setIsReceiptsOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<
    string | null
  >(null);

  const utils = trpc.useUtils();
  const activeSiteId =
    typeof window !== "undefined"
      ? localStorage.getItem("active-site-id")
      : null;

  // 1. Fetch user role and memberships
  const { data: mySites, isLoading: loadingSites } =
    trpc.site.getMySites.useQuery();
  const currentMembership = mySites?.find((s) => s.site?.id === activeSiteId);
  const isAdmin =
    currentMembership?.role?.name === "SITE_ADMIN" ||
    currentMembership?.role?.name === "SUPER_ADMIN";

  // 2. Fetch announcements
  const { data: announcements = [], isLoading: loadingAnnouncements } =
    trpc.announcement.listAnnouncements.useQuery(undefined, {
      enabled: !!activeSiteId,
    });

  // 3. Fetch announcement details
  const { data: detailData, isLoading: loadingDetail } =
    trpc.announcement.getAnnouncementDetail.useQuery(
      { id: selectedAnnouncementId! },
      { enabled: isDetailOpen && !!selectedAnnouncementId },
    );

  // 4. Fetch read receipts (Admin only)
  const { data: receipts = [], isLoading: loadingReceipts } =
    trpc.announcement.getReadReceipts.useQuery(
      { announcementId: selectedAnnouncementId! },
      { enabled: isReceiptsOpen && !!selectedAnnouncementId && isAdmin },
    );

  // Mutations
  const createMutation = trpc.announcement.createAnnouncement.useMutation({
    onSuccess: () => {
      showToast(
        "success",
        "Duyuru başarıyla yayınlandı ve sakinlere bildirildi!",
      );
      utils.announcement.listAnnouncements.invalidate();
      setIsAddOpen(false);
    },
    onError: (err) => showToast("error", err.message || "Duyuru yayınlanamadı"),
  });

  const handleCreate = (
    title: string,
    content: string,
    priority: "NORMAL" | "IMPORTANT" | "URGENT",
  ) => {
    createMutation.mutate({ title, content, priority });
  };

  const priorityLabels = {
    NORMAL: "Duyuru",
    IMPORTANT: "Önemli",
    URGENT: "Acil Durum",
  };
  const priorityColors = {
    NORMAL: "bg-blue-500/15 border-blue-500/20 text-blue-400",
    IMPORTANT: "bg-amber-500/15 border-amber-500/20 text-amber-400 shadow-glow",
    URGENT:
      "bg-red-500/15 border-red-500/20 text-red-400 shadow-glow animate-pulse",
  };

  if (loadingSites || loadingAnnouncements) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Duyurular & Bildirimler
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Site yönetimi tarafından yayınlanan genel, önemli ve acil durum
            duyuruları
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-glow flex items-center justify-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Duyuru Yayınla
          </button>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Güncel Duyurular
        </h2>

        <AnnouncementList
          announcements={announcements}
          isAdmin={isAdmin}
          onViewDetail={(id) => {
            setSelectedAnnouncementId(id);
            setIsDetailOpen(true);
          }}
          onViewReceipts={(id) => {
            setSelectedAnnouncementId(id);
            setIsReceiptsOpen(true);
          }}
        />
      </section>

      <CreateAnnouncementModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreate={handleCreate}
        isPending={createMutation.isPending}
      />

      <AnnouncementDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAnnouncementId(null);
          utils.announcement.listAnnouncements.invalidate();
        }}
        isLoading={loadingDetail}
        data={detailData}
        priorityLabels={priorityLabels}
        priorityColors={priorityColors}
      />

      <ReadReceiptsModal
        isOpen={isReceiptsOpen}
        onClose={() => setIsReceiptsOpen(false)}
        isLoading={loadingReceipts}
        receipts={receipts}
      />
    </div>
  );
}
