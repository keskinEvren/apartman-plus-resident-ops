"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationDrawer } from "@/components/layout/NotificationDrawer";
import { ToastContainer } from "@/components/shared/Toast";
import { trpc } from "@/lib/trpc";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: notifications = [] } =
    trpc.notification.listMyNotifications.useQuery();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      <Header
        unreadCount={unreadCount}
        onNotificationClick={() => setIsDrawerOpen(true)}
      />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 mt-14 p-6 animate-fade-in">
          {children}
        </main>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
      <ToastContainer />
    </div>
  );
}
