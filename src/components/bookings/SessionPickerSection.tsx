"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { DayTabs } from "./DayTabs";
import { SessionSlot } from "./SessionSlot";
import { GlassCard } from "@/components/shared/GlassCard";

interface SessionPickerSectionProps {
  selectedDay: number;
  setSelectedDay: React.Dispatch<React.SetStateAction<number>>;
  selectedSession: string | null;
  setSelectedSession: (session: string | null) => void;
  date: string;
  setDate: (date: string) => void;
  sessions?: any[];
  handleBook: () => void;
  isBookingPending: boolean;
}

export function SessionPickerSection({
  selectedDay,
  setSelectedDay,
  selectedSession,
  setSelectedSession,
  date,
  setDate,
  sessions = [],
  handleBook,
  isBookingPending,
}: SessionPickerSectionProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (diff > minSwipeDistance) {
      if (selectedDay < 6) {
        setSelectedDay((prev) => prev + 1);
        setSelectedSession(null);
      }
    } else if (diff < -minSwipeDistance) {
      if (selectedDay > 0) {
        setSelectedDay((prev) => prev - 1);
        setSelectedSession(null);
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <section
      className="animate-fade-in touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Gün & Seans
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (selectedDay > 0) {
                setSelectedDay((prev) => prev - 1);
                setSelectedSession(null);
              }
            }}
            disabled={selectedDay === 0}
            className="p-1 rounded bg-secondary/30 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
            title="Önceki Gün"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (selectedDay < 6) {
                setSelectedDay((prev) => prev + 1);
                setSelectedSession(null);
              }
            }}
            disabled={selectedDay === 6}
            className="p-1 rounded bg-secondary/30 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
            title="Sonraki Gün"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DayTabs
        selectedDay={selectedDay}
        onSelect={(day) => {
          setSelectedDay(day);
          setSelectedSession(null);
        }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sessions.map((s) => (
          <SessionSlot
            key={s.id}
            id={s.id}
            startTime={s.startTime}
            endTime={s.endTime}
            capacity={s.capacity}
            bookedCount={s.bookedCount || 0}
            isSelected={selectedSession === s.id}
            onSelect={setSelectedSession}
          />
        ))}
        {sessions.length === 0 && (
          <GlassCard className="col-span-full text-center py-8">
            <p className="text-sm text-muted-foreground">
              Bu gün için tanımlı seans yok
            </p>
          </GlassCard>
        )}
      </div>

      {selectedSession && (
        <GlassCard className="mt-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Rezervasyon Tarihi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <button
              onClick={handleBook}
              disabled={isBookingPending}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              {isBookingPending ? "Kaydediliyor..." : "Rezervasyon Yap"}
            </button>
          </div>
        </GlassCard>
      )}
    </section>
  );
}
