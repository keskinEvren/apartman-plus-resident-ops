"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { showToast } from "@/components/shared/Toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { Plus, CalendarDays } from "lucide-react";

interface SessionManagerProps {
  amenityId: string;
}

const DAYS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

export function SessionManager({ amenityId }: SessionManagerProps) {
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [capacity, setCapacity] = useState(10);

  const utils = trpc.useUtils();
  const { data: sessions = [], isLoading } = trpc.booking.listSessions.useQuery(
    {
      amenityId,
      includeInactive: true,
    },
  );

  const createSession = trpc.booking.createSession.useMutation({
    onSuccess: () => {
      showToast("success", "Seans slotu eklendi!");
      utils.booking.listSessions.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  const toggleSession = trpc.booking.toggleSessionActive.useMutation({
    onSuccess: () => {
      showToast("success", "Seans durumu güncellendi!");
      utils.booking.listSessions.invalidate();
    },
    onError: (err) => showToast("error", err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSession.mutate({
      amenityId,
      dayOfWeek,
      startTime,
      endTime,
      capacity,
    });
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-primary" />
          Yeni Seans Ekle
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
        >
          <div className="sm:col-span-2">
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="input-field w-full rounded-xl px-3 py-2 text-sm"
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <input
            placeholder="Başlangıç (09:00)"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input-field w-full rounded-xl px-4 py-2 text-sm"
            required
          />
          <input
            placeholder="Bitiş (10:00)"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="input-field w-full rounded-xl px-4 py-2 text-sm"
            required
          />
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="input-field w-full sm:col-span-2 rounded-xl px-4 py-2 text-sm"
            min={1}
            required
          />
          <button
            type="submit"
            disabled={createSession.isPending}
            className="sm:col-span-2 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <Plus className="h-4 w-4" /> Seans Ekle
          </button>
        </form>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Seans Slotları
        </h3>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-secondary border border-border rounded-xl flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-xs">{DAYS[s.dayOfWeek]} günü</p>
                  <p className="text-xs text-primary font-semibold mt-0.5">
                    {s.startTime} - {s.endTime}{" "}
                    <span className="text-muted-foreground font-normal">
                      (Kontenjan: {s.capacity})
                    </span>
                  </p>
                </div>
                <button
                  onClick={() =>
                    toggleSession.mutate({
                      sessionId: s.id,
                      isActive: !s.isActive,
                    })
                  }
                  className={`text-[10px] px-2 py-1 rounded font-semibold transition ${
                    s.isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {s.isActive ? "Aktif" : "Pasif"}
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground/60 italic text-center py-4">
                Bu tesis için henüz seans slotu tanımlanmamış.
              </p>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
