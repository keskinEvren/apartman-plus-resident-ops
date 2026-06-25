"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { TicketListItem } from "@/lib/types";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CreateTicketModal } from "@/components/tickets/CreateTicketModal";
import { TicketDetailModal } from "@/components/tickets/TicketDetailModal";
import { ResidentTicketList } from "@/components/tickets/ResidentTicketList";
import { StaffTicketList } from "@/components/tickets/StaffTicketList";
import { TicketsHeader } from "@/components/tickets/TicketsHeader";
import { TicketStats } from "@/components/tickets/TicketStats";
import {
  categoryIcons,
  categoryLabels,
  statusLabels,
  statusColors,
} from "@/components/tickets/ticketConstants";

export function TicketsClient() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketListItem | null>(null);
  const utils = trpc.useUtils();
  const activeSiteId =
    typeof window !== "undefined"
      ? localStorage.getItem("active-site-id")
      : null;

  // 1. Fetch user role and memberships
  const { data: mySites, isLoading: loadingSites } =
    trpc.site.getMySites.useQuery();
  const currentMembership = mySites?.find((s) => s.site?.id === activeSiteId);
  const isStaff =
    currentMembership?.role?.name === "STAFF" ||
    currentMembership?.role?.name === "SITE_ADMIN" ||
    currentMembership?.role?.name === "SUPER_ADMIN";

  // 2. Fetch Tickets
  const { data: myTickets = [], isLoading: loadingMyTickets } =
    trpc.ticket.listMyTickets.useQuery(undefined, {
      enabled: !isStaff && !!activeSiteId,
    });
  const { data: staffTickets = [], isLoading: loadingStaffTickets } =
    trpc.ticket.listStaffTickets.useQuery(undefined, {
      enabled: isStaff && !!activeSiteId,
    });

  // Mutations
  const createMutation = trpc.ticket.createTicket.useMutation({
    onSuccess: () => {
      showToast("success", "Talep başarıyla oluşturuldu!");
      utils.ticket.listMyTickets.invalidate();
      setIsAddOpen(false);
    },
    onError: (err) => showToast("error", err.message || "Talep oluşturulamadı"),
  });

  const assignMutation = trpc.ticket.assignTicket.useMutation({
    onSuccess: () => {
      showToast(
        "success",
        "Talep üzerinize atandı ve İŞLEMDE olarak güncellendi!",
      );
      utils.ticket.listStaffTickets.invalidate();
      if (selectedTicket)
        setSelectedTicket((prev: TicketListItem | null) => prev ? { ...prev, status: "IN_PROGRESS" } : null);
    },
    onError: (err) => showToast("error", err.message || "Atama yapılamadı"),
  });

  const statusMutation = trpc.ticket.updateTicketStatus.useMutation({
    onSuccess: (data) => {
      showToast("success", `Talep durumu güncellendi: ${data.status}`);
      utils.ticket.listStaffTickets.invalidate();
      utils.ticket.listMyTickets.invalidate();
      if (selectedTicket)
        setSelectedTicket((prev: TicketListItem | null) => prev ? { ...prev, status: data.status } : null);
    },
    onError: (err) => showToast("error", err.message || "Durum güncellenemedi"),
  });

  const handleAssignToMe = (ticketId: string) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
    if (!token) return;
    const { userId } = JSON.parse(atob(token.split(".")[1]));
    assignMutation.mutate({ ticketId, assignedStaffUserId: userId });
  };

  const activeTickets = isStaff ? staffTickets : myTickets;
  const pendingCount = activeTickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
  ).length;

  if (loadingSites || (isStaff ? loadingStaffTickets : loadingMyTickets)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <TicketsHeader
        isStaff={isStaff}
        blockName={currentMembership?.blockId ? "A Blok" : null}
        onOpenAdd={() => setIsAddOpen(true)}
      />
      <TicketStats pendingCount={pendingCount} />
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {isStaff ? "Site Destek Talepleri" : "Talep Geçmişim"}
        </h2>
        {isStaff ? (
          <StaffTicketList
            tickets={staffTickets}
            categoryIcons={categoryIcons}
            categoryLabels={categoryLabels}
            statusLabels={statusLabels}
            statusColors={statusColors}
            onSelect={(ticket) => {
              setSelectedTicket(ticket);
              setIsDetailsOpen(true);
            }}
            onAssignClick={handleAssignToMe}
          />
        ) : (
          <ResidentTicketList
            tickets={myTickets}
            categoryIcons={categoryIcons}
            categoryLabels={categoryLabels}
            statusLabels={statusLabels}
            statusColors={statusColors}
            onSelect={(ticket) => {
              setSelectedTicket(ticket);
              setIsDetailsOpen(true);
            }}
          />
        )}
      </section>
      <CreateTicketModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreate={(c, t, d) =>
          createMutation.mutate({ category: c, title: t, description: d })
        }
        isPending={createMutation.isPending}
      />
      <TicketDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        isStaff={isStaff}
        onAssign={() => selectedTicket && handleAssignToMe(selectedTicket.id)}
        onUpdateStatus={(status) =>
          selectedTicket && statusMutation.mutate({ ticketId: selectedTicket.id, status })
        }
        statusLabels={statusLabels}
        statusColors={statusColors}
        categoryLabels={categoryLabels}
      />
    </div>
  );
}
