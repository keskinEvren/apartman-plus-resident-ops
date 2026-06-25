"use client";

import React from "react";
import { Check, Minus } from "lucide-react";

interface ResidentPreferenceMatrixProps {
  preferences: any;
}

export function ResidentPreferenceMatrix({
  preferences,
}: ResidentPreferenceMatrixProps) {
  const rows = [
    { key: "announcements", label: "Duyurular" },
    { key: "packages", label: "Kargolar" },
    { key: "visitors", label: "Ziyaretçiler" },
    { key: "bookings", label: "Rezervasyonlar" },
  ] as const;

  const channels = ["Email", "Sms", "Push", "InApp"] as const;

  return (
    <div className="overflow-x-auto text-xs text-foreground">
      <table className="w-full min-w-[500px] text-left border-collapse">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-[9px] uppercase font-bold tracking-wider">
            <th className="py-2 pr-4">Bildirim Kategorisi</th>
            {channels.map((ch) => (
              <th key={ch} className="py-2 px-4 text-center">
                {ch === "Email"
                  ? "E-Posta"
                  : ch === "Sms"
                    ? "SMS"
                    : ch === "Push"
                      ? "Push"
                      : "Uygulama İçi"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.key} className="hover:bg-muted transition-all">
              <td className="py-3 pr-4 font-bold text-[11px] text-foreground">
                {row.label}
              </td>
              {channels.map((ch) => {
                const active = preferences
                  ? !!preferences[`${row.key}${ch}` as keyof typeof preferences]
                  : false;
                return (
                  <td key={ch} className="py-3 px-4 text-center">
                    <div className="inline-flex items-center justify-center p-1 rounded-full">
                      {active ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
