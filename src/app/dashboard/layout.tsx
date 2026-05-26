"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { QuickActionFab } from "@/components/dashboard/QuickActionFab";
import { NotificationDrawer } from "@/components/layout/NotificationDrawer";
import { ToastContainer } from "@/components/shared/Toast";
import { trpc } from "@/lib/trpc";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname, searchParams]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // swipe left by 50px
    if (isLeftSwipe && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const { data: notifications = [] } =
    trpc.notification.listMyNotifications.useQuery();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      <Header
        unreadCount={unreadCount}
        onNotificationClick={() => setIsDrawerOpen(true)}
        onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMenuOpen={isMobileSidebarOpen}
      />
      <div
        className="flex relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 top-14 z-20 bg-black/40 backdrop-blur-xs lg:hidden"
          />
        )}
        <main className="flex-1 ml-0 lg:ml-64 mt-14 p-4 sm:p-6 pb-20 lg:pb-6 animate-fade-in min-w-0">
          {children}
        </main>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
      <BottomNav />
      <QuickActionFab />
      <ToastContainer />
    </div>
  );
}
