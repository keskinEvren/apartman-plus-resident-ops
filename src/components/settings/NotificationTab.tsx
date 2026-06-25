"use client";

import React from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

const ROWS = [
  { key: "announcements", label: "Duyurular", desc: "Genel bilgilendirmeler." },
  {
    key: "packages",
    label: "Kargo Paketleri",
    desc: "Adınıza gelen kargolar.",
  },
  {
    key: "visitors",
    label: "Ziyaretçi Girişleri",
    desc: "Ziyaretçi durumları.",
  },
  {
    key: "bookings",
    label: "Tesis Rezervasyonları",
    desc: "Sosyal tesis rezervasyon onayı.",
  },
] as const;

export function NotificationTab() {
  const utils = trpc.useUtils();
  const { data: pref, isLoading } =
    trpc.preference.getNotificationPreferences.useQuery();
  const updatePreferences =
    trpc.preference.updateNotificationPreferences.useMutation({
      onSuccess: () => {
        showToast("success", "Tercihleriniz güncellendi!");
        utils.preference.getNotificationPreferences.invalidate();
      },
      onError: (err) => showToast("error", err.message || "Hata oluştu"),
    });

  if (isLoading || !pref) return <LoadingSpinner size="lg" />;

  const handleToggle = (
    rowKey: string,
    channel: "Email" | "Sms" | "Push" | "InApp",
  ) => {
    const currentInput = {
      announcementsEmail: pref.announcementsEmail,
      announcementsSms: pref.announcementsSms,
      announcementsPush: pref.announcementsPush,
      announcementsInApp: pref.announcementsInApp,
      packagesEmail: pref.packagesEmail,
      packagesSms: pref.packagesSms,
      packagesPush: pref.packagesPush,
      packagesInApp: pref.packagesInApp,
      visitorsEmail: pref.visitorsEmail,
      visitorsSms: pref.visitorsSms,
      visitorsPush: pref.visitorsPush,
      visitorsInApp: pref.visitorsInApp,
      bookingsEmail: pref.bookingsEmail,
      bookingsSms: pref.bookingsSms,
      bookingsPush: pref.bookingsPush,
      bookingsInApp: pref.bookingsInApp,
    };
    const targetKey = `${rowKey}${channel}` as keyof typeof currentInput;
    currentInput[targetKey] = !currentInput[targetKey];
    updatePreferences.mutate(currentInput);
  };

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in text-sm">
      <GlassCard className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-bold text-base">Bildirim Tercihleri Matrisi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kanal tercihlerini belirleyin.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 pr-4">Bildirim Kategorisi</th>
                <th className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" /> E-Posta
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> SMS
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Smartphone className="h-3 w-3" /> Mobil Push
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Uygulama İçi
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {ROWS.map((row) => (
                <tr
                  key={row.key}
                  className="hover:bg-secondary transition-all"
                >
                  <td className="py-4 pr-4 max-w-[280px]">
                    <p className="font-bold text-foreground">{row.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                      {row.desc}
                    </p>
                  </td>
                  {(["Email", "Sms", "Push", "InApp"] as const).map(
                    (channel) => {
                      const prefKey =
                        `${row.key}${channel}` as keyof typeof pref;
                      return (
                        <td key={channel} className="py-4 px-4 text-center">
                          <label className="relative inline-flex items-center justify-center cursor-pointer p-2">
                            <input
                              id={`notif-${row.key}-${channel.toLowerCase()}`}
                              type="checkbox"
                              checked={!!pref[prefKey]}
                              disabled={updatePreferences.isPending}
                              onChange={() => handleToggle(row.key, channel)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[10px] after:left-[10px] after:bg-muted-foreground after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white peer-checked:after:border-primary transition-all"></div>
                          </label>
                        </td>
                      );
                    },
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 p-3.5 bg-primary/5 border border-primary/10 rounded-xl text-[11px] text-primary/95">
          <ShieldAlert className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Kritik acil durum bildirimleri doğrudan iletilmeye devam eder.
          </span>
        </div>
      </GlassCard>
    </div>
  );
}
